from typing import Optional
import fastapi
from pydantic import BaseModel
from fastapi import Depends, Request
from sqlalchemy.orm import Session

from spotifyops.agent.playlist_agent import DrakePlaylistAgent
from spotifyops.database.models import get_db, Session as DbSession
from spotifyops.logic.reorder_logic import sequence_playlist
from spotifyops.logic.intelligent_reorder import IntelligentReorderCalculator
from spotifyops.logic.embedding_store import VectorMemory
from spotifyops.tools.spotify import SpotifyPlaylistOps

router = fastapi.APIRouter()


class ReorderRequest(BaseModel):
    playlist_id: str
    reorder_style: str
    user_intent: Optional[str] = None
    personal_tone: Optional[str] = None
    reorder_method: str = "auto"  # "auto", "intelligent", "full_rewrite"


@router.post("/reorder-playlist")
async def reorder_playlist(request: ReorderRequest, httpRequest: Request, db: Session = Depends(get_db)):
    session_id = httpRequest.cookies.get("session_id")
    if not session_id:
        raise fastapi.HTTPException(status_code=401, detail="Not authenticated")

    session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not session:
        raise fastapi.HTTPException(status_code=401, detail="Invalid session")

    spotify = SpotifyPlaylistOps(user=session.user)
    agent = DrakePlaylistAgent()
    memory = VectorMemory()
    reorder_calculator = IntelligentReorderCalculator()

    # 1. Get tracks from the playlist
    tracks = await spotify.get_playlist_tracks(request.playlist_id)
    original_track_ids = [track['track_id'] for track in tracks]

    # 2. Analyze each track (check cache first like in main.py)
    analyses = []
    for track in tracks:
        track_id = track['track_id']
        
        # Check if analysis already exists in vector memory
        existing_analysis = memory.get_existing_analysis(track_id)
        if existing_analysis:
            print(f"Using cached analysis for '{track['name']}' (ID: {track_id})")
            analyses.append(existing_analysis)
            continue
        
        # Analyze the song if not in cache
        print(f"Analyzing: '{track['name']}' by {track['artist']}")
        analysis = agent.analyze_song(track['name'], track['artist'])
        
        if 'error' not in analysis:
            song_analysis = {
                "track_info": track,
                "analysis": analysis
            }
            analyses.append(song_analysis)
            # Store in vector memory for future use
            memory.add_song_analysis(track_info=track, analysis=analysis)
            print(f"Successfully analyzed and cached: '{track['name']}'")
        else:
            print(f"Analysis failed for '{track['name']}': {analysis.get('raw_output', 'Unknown error')}")
            # Create a fallback analysis with basic information
            fallback_analysis = {
                "analysis_summary": f"Track: {track['name']} by {track['artist']}",
                "narrative_category": "Unknown",
                "emotional_tone": "Neutral"
            }
            analyses.append({
                "track_info": track,
                "analysis": fallback_analysis
            })
            print(f"Added fallback analysis for '{track['name']}'")

    # Filter out any analyses that still have errors
    valid_analyses = [
        analysis for analysis in analyses 
        if 'error' not in analysis.get('analysis', {})
    ]
    
    if not valid_analyses:
        return {"status": "error", "message": "No valid song analyses available for reordering."}
    
    print(f"Using {len(valid_analyses)} valid analyses out of {len(analyses)} total")

    # 3. Sequence the playlist with user preferences
    new_track_order = sequence_playlist(
        valid_analyses, 
        request.reorder_style, 
        request.user_intent, 
        request.personal_tone
    )

    if not new_track_order:
        return {"status": "error", "message": "Failed to reorder playlist."}

    # 4. Determine reordering strategy
    strategy_result = None
    try:
        if request.reorder_method == "auto":
            strategy_result = reorder_calculator.calculate_reorder_strategy(
                original_track_ids, new_track_order
            )
            chosen_strategy = strategy_result["strategy"]
        elif request.reorder_method == "intelligent":
            chosen_strategy = "intelligent_moves"
            strategy_result = reorder_calculator.calculate_reorder_strategy(
                original_track_ids, new_track_order
            )
        else:
            chosen_strategy = "full_rewrite"
    except Exception as e:
        print(f"Error calculating reorder strategy: {e}")
        # Fallback to full rewrite on error
        chosen_strategy = "full_rewrite"
        strategy_result = {"reason": f"Strategy calculation failed: {str(e)}"}

    # 5. Apply the chosen strategy
    success = False
    strategy_info = {"method": chosen_strategy}
    
    if chosen_strategy == "intelligent_moves" and strategy_result:
        # Use intelligent moves
        moves = strategy_result.get("moves", [])
        if moves and isinstance(moves, list):
            success = await spotify.apply_intelligent_reorder(request.playlist_id, moves)
            strategy_info.update({
                "moves_applied": len(moves),
                "similarity": strategy_result.get("similarity", 0),
                "efficiency_gain": strategy_result.get("efficiency_gain", 0),
                "reason": strategy_result.get("reason", "")
            })
        else:
            # Fallback to full rewrite if no moves calculated
            success = await spotify.update_playlist_track_order(request.playlist_id, new_track_order)
            strategy_info["method"] = "full_rewrite"
            strategy_info["reason"] = "No intelligent moves calculated, using full rewrite"
    else:
        # Use full rewrite
        success = await spotify.update_playlist_track_order(request.playlist_id, new_track_order)
        if strategy_result:
            strategy_info.update({
                "reason": strategy_result.get("reason", "Full rewrite chosen"),
                "move_count": strategy_result.get("move_count", len(new_track_order))
            })

    if success:
        return {
            "status": "success", 
            "strategy": strategy_info,
            "tracks_reordered": len(new_track_order)
        }
    else:
        return {
            "status": "error", 
            "message": "Failed to apply reordering strategy.",
            "strategy": strategy_info
        }
