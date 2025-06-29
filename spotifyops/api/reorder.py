import fastapi
from pydantic import BaseModel
from fastapi import Depends, Request
from sqlalchemy.orm import Session

from spotifyops.agent.playlist_agent import DrakePlaylistAgent
from spotifyops.database.models import get_db, Session as DbSession
from spotifyops.logic.reorder_logic import sequence_playlist
from spotifyops.tools.spotify import SpotifyPlaylistOps

router = fastapi.APIRouter()


class ReorderRequest(BaseModel):
    playlist_id: str
    reorder_style: str


@router.post("/api/reorder-playlist")
async def reorder_playlist(request: ReorderRequest, httpRequest: Request, db: Session = Depends(get_db)):
    session_id = httpRequest.cookies.get("session_id")
    if not session_id:
        raise fastapi.HTTPException(status_code=401, detail="Not authenticated")

    session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not session:
        raise fastapi.HTTPException(status_code=401, detail="Invalid session")

    spotify = SpotifyPlaylistOps(user=session.user)
    agent = DrakePlaylistAgent()

    # 1. Get tracks from the playlist
    tracks = await spotify.get_playlist_tracks(request.playlist_id)

    # 2. Analyze each track
    analyses = []
    for track in tracks:
        analysis = agent.analyze_song(track['name'], track['artist'])
        analyses.append({"track_info": track, "analysis": analysis})

    # 3. Sequence the playlist
    new_track_order = sequence_playlist(analyses)

    # 4. Update the playlist
    if new_track_order:
        await spotify.update_playlist_track_order(request.playlist_id, new_track_order)
        return {"status": "success"}
    else:
        return {"status": "error", "message": "Failed to reorder playlist."}
