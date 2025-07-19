from fastapi.responses import RedirectResponse
from typing import Optional
from uuid import uuid4

import fastapi
import httpx
from fastapi import Request, Depends, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel

from spotifyops.config.config import Config
from spotifyops.database.models import get_db, User, Session as DbSession
from spotifyops.tools.spotify import SpotifyPlaylistOps

router = fastapi.APIRouter()


@router.get('/spotify/login')
async def login():
    state = str(uuid4())
    params = {
        'client_id': Config.CLIENT_ID,
        'response_type': 'code',
        'redirect_uri': Config.CALLBACK_URL,
        'state': state,
        'scope': Config.SCOPE
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(Config.AUTH_URL, params=params)
    return {"auth_url": str(response.url)}


@router.get('/callback')
async def callback(request: Request, response: Response, code: Optional[str] = None, db: Session = Depends(get_db)):
    print(f"Callback received with code: {code is not None}")
    print(f"Request headers: {dict(request.headers)}")
    
    if code is None:
        print("Authorization code not provided")
        return {"error": "Authorization code not provided."}

    payload = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': Config.CALLBACK_URL,
    }
    
    print("Exchanging code for tokens...")
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            Config.TOKEN_URL,
            data=payload,
            headers=Config.get_headers()
        )
    
    token_data = token_response.json()
    print(f"Token response status: {token_response.status_code}")
    
    access_token = token_data.get('access_token')
    refresh_token = token_data.get('refresh_token')
    
    if not access_token:
        print("Failed to get access token")
        return {"error": "Failed to get access token"}

    print("Getting user info...")
    async with httpx.AsyncClient() as client:
        user_response = await client.get(
            f"{Config.BASE_URL}/v1/me",
            headers={'Authorization': f'Bearer {access_token}'}
        )
    user_data = user_response.json()
    user_id = user_data.get('id')
    print(f"User ID: {user_id}")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        print("Creating new user")
        user = User(id=user_id)
        db.add(user)
    else:
        print("Found existing user")

    user.set_tokens(access_token, refresh_token)
    
    session_id = str(uuid4())
    print(f"Creating session: {session_id}")
    db_session = DbSession(id=session_id, user_id=user_id)
    db.add(db_session)
    db.commit()

    print(f"Setting session and redirecting to: {Config.FRONTEND_URL}")
    
    # Instead of setting cookie directly, redirect to frontend with session token
    # The frontend will then call an endpoint to exchange this for a proper cookie
    redirect_url = f"{Config.FRONTEND_URL}/callback?session_token={session_id}"
    response = RedirectResponse(url=redirect_url)
    
    print(f"Redirecting with session_token: {session_id}")
    return response


@router.get('/me')
async def get_me(request: Request, db: Session = Depends(get_db)):
    session_id = request.cookies.get("session_id")
    print(f"Get me called, session_id: {session_id}")
    
    if not session_id:
        print("No session_id found in cookies")
        raise fastapi.HTTPException(status_code=401, detail="Not authenticated")

    session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not session:
        print("No session found in database")
        raise fastapi.HTTPException(status_code=401, detail="Invalid session")

    print(f"Found session for user: {session.user_id}")
    return {"user_id": session.user_id}


@router.get('/spotify/playlists')
async def get_playlists(request: Request, db: Session = Depends(get_db)):
    session_id = request.cookies.get("session_id")
    print(f"Get playlists called, session_id: {session_id}")
    
    if not session_id:
        print("No session_id found for playlists request")
        raise fastapi.HTTPException(status_code=401, detail="Not authenticated")

    session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not session:
        print("No session found in database for playlists request")
        raise fastapi.HTTPException(status_code=401, detail="Invalid session")

    print(f"Getting playlists for user: {session.user_id}")
    spotify = SpotifyPlaylistOps(user=session.user)
    playlists = await spotify.get_user_playlists()
    
    # Check if authentication failed due to invalid tokens
    if playlists is None:
        print("Authentication failed - tokens likely invalid, clearing session")
        db.delete(session)
        db.commit()
        raise fastapi.HTTPException(status_code=401, detail="Authentication failed - please re-login")
    
    if playlists and isinstance(playlists, dict) and 'items' in playlists:
        print(f"Retrieved {len(playlists['items'])} playlists")
    else:
        print(f"Retrieved playlists response: {type(playlists)}")
    return playlists


@router.get('/debug/auth')
async def debug_auth(request: Request, db: Session = Depends(get_db)):
    """Debug endpoint to check authentication status"""
    cookies = dict(request.cookies)
    session_id = request.cookies.get("session_id")
    
    debug_info = {
        "cookies": cookies,
        "session_id": session_id,
        "has_session_id": session_id is not None
    }
    
    if session_id:
        session = db.query(DbSession).filter(DbSession.id == session_id).first()
        debug_info["session_found"] = session is not None
        if session:
            debug_info["user_id"] = session.user_id
            user = db.query(User).filter(User.id == session.user_id).first()
            debug_info["user_found"] = user is not None
            if user:
                debug_info["user_has_tokens"] = bool(user.access_token and user.refresh_token)
    
    return debug_info


@router.post('/set-session')
async def set_session(request: Request, response: Response, db: Session = Depends(get_db)):
    """Exchange a session token for a proper session cookie"""
    data = await request.json()
    session_token = data.get('session_token')
    
    print(f"Set session called with token: {session_token}")
    
    if not session_token:
        raise fastapi.HTTPException(status_code=400, detail="Session token required")
    
    # Verify the session exists in the database
    session = db.query(DbSession).filter(DbSession.id == session_token).first()
    if not session:
        raise fastapi.HTTPException(status_code=401, detail="Invalid session token")
    
    print(f"Setting cookie for user: {session.user_id}")
    
    # Set the session cookie
    response.set_cookie(
        key="session_id", 
        value=session_token, 
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=86400 * 7,  # 7 days
        path="/"  # Ensure cookie is available for all paths
    )
    
    return {"success": True, "user_id": session.user_id}


@router.get('/me/profile')
async def get_profile(request: Request, db: Session = Depends(get_db)):
    """Get user profile information"""
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise fastapi.HTTPException(status_code=401, detail="Not authenticated")

    session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not session:
        raise fastapi.HTTPException(status_code=401, detail="Invalid session")

    user = session.user
    return {
        "id": user.id,
        "spotify_username": user.spotify_username,
        "email": user.email,
        "total_reorders": user.total_reorders,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }


@router.get('/me/usage')
async def get_usage(request: Request, db: Session = Depends(get_db)):
    """Get user usage information and limits"""
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise fastapi.HTTPException(status_code=401, detail="Not authenticated")

    session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not session:
        raise fastapi.HTTPException(status_code=401, detail="Invalid session")

    user = session.user
    
    return {
        "total_reorders": user.total_reorders,
        "can_reorder": True,
        "message": "Ready to reorder playlists"
    }


class PlaylistTracksRequest(BaseModel):
    playlist_id: str

@router.post('/spotify/playlist-tracks')
async def get_playlist_tracks(request: PlaylistTracksRequest, httpRequest: Request, db: Session = Depends(get_db)):
    """Get tracks from a specific playlist"""
    session_id = httpRequest.cookies.get("session_id")
    if not session_id:
        raise fastapi.HTTPException(status_code=401, detail="Not authenticated")

    session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not session:
        raise fastapi.HTTPException(status_code=401, detail="Invalid session")

    spotify = SpotifyPlaylistOps(user=session.user)
    
    try:
        tracks = await spotify.get_playlist_tracks(request.playlist_id)
        if not tracks:
            raise fastapi.HTTPException(status_code=404, detail="Playlist not found or empty")
        
        return {
            "status": "success",
            "tracks": tracks,
            "total_tracks": len(tracks)
        }
    except Exception as e:
        print(f"Error fetching playlist tracks: {str(e)}")
        raise fastapi.HTTPException(status_code=500, detail=f"Failed to fetch playlist tracks: {str(e)}")