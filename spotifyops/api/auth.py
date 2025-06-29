from fastapi.responses import RedirectResponse
from typing import Optional
from uuid import uuid4

import fastapi
import httpx
from fastapi import Request, Depends, Response
from sqlalchemy.orm import Session

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
    if code is None:
        return {"error": "Authorization code not provided."}

    payload = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': Config.CALLBACK_URL,
    }
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            Config.TOKEN_URL,
            data=payload,
            headers=Config.get_headers()
        )
    token_data = token_response.json()
    access_token = token_data.get('access_token')
    refresh_token = token_data.get('refresh_token')

    async with httpx.AsyncClient() as client:
        user_response = await client.get(
            f"{Config.BASE_URL}/v1/me",
            headers={'Authorization': f'Bearer {access_token}'}
        )
    user_data = user_response.json()
    user_id = user_data.get('id')

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(id=user_id)
        db.add(user)

    user.set_tokens(access_token, refresh_token)
    
    session_id = str(uuid4())
    db_session = DbSession(id=session_id, user_id=user_id)
    db.add(db_session)
    db.commit()

    response.set_cookie(key="session_id", value=session_id, httponly=True)
    return RedirectResponse(url=Config.FRONTEND_URL)


@router.get('/api/me')
async def get_me(request: Request, db: Session = Depends(get_db)):
    session_id = request.cookies.get("session_id")
    if not session_id:
        return None

    session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not session:
        return None

    return {"user_id": session.user_id}


@router.get('/spotify/playlists')
async def get_playlists(request: Request, db: Session = Depends(get_db)):
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise fastapi.HTTPException(status_code=401, detail="Not authenticated")

    session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not session:
        raise fastapi.HTTPException(status_code=401, detail="Invalid session")

    spotify = SpotifyPlaylistOps(user=session.user)
    playlists = await spotify.get_user_playlists()
    return playlists