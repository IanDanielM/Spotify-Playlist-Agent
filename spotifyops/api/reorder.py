from typing import Optional
import fastapi
from pydantic import BaseModel
from fastapi import Depends, Request, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime

from spotifyops.agent.playlist_agent import PlaylistAgent
from spotifyops.database.models import get_db, Session as DbSession, User
from spotifyops.database.models import ReorderJob, JobStatus
from spotifyops.logic.reorder_logic import sequence_playlist
from spotifyops.logic.intelligent_reorder import IntelligentReorderCalculator
from spotifyops.logic.embedding_store import VectorMemory
from spotifyops.tools.spotify import SpotifyPlaylistOps
from spotifyops.background.job_processor import process_reorder_job_background

router = fastapi.APIRouter()


class ReorderRequest(BaseModel):
    playlist_id: str
    reorder_style: str
    user_intent: Optional[str] = None
    personal_tone: Optional[str] = None
    reorder_method: str = "auto"  # "auto", "intelligent", "full_rewrite"
    async_processing: bool = False  # New field for async mode


class PreviewRequest(BaseModel):
    playlist_id: str
    reorder_style: str
    user_intent: Optional[str] = None
    personal_tone: Optional[str] = None
    reorder_method: str = "auto"


class ReorderTrackRequest(BaseModel):
    playlist_id: str
    range_start: int
    insert_before: int
    range_length: int = 1
    snapshot_id: Optional[str] = None


@router.post("/reorder-playlist-async")
async def reorder_playlist_async(request: ReorderRequest, background_tasks: BackgroundTasks, 
                                httpRequest: Request, db: Session = Depends(get_db)):
    """
    Start an async playlist reorder job.
    Returns job ID immediately, processing happens in background.
    """
    session_id = httpRequest.cookies.get("session_id")
    if not session_id:
        raise fastapi.HTTPException(status_code=401, detail="Not authenticated")

    session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not session:
        raise fastapi.HTTPException(status_code=401, detail="Invalid session")

    spotify = SpotifyPlaylistOps(user=session.user)
    
    # Get basic playlist info for the job
    try:
        tracks = await spotify.get_playlist_tracks(request.playlist_id)
        if not tracks:
            raise fastapi.HTTPException(status_code=404, detail="Playlist not found or empty")
        
        # Get playlist name (try to get from Spotify API first)
        playlist_name = "Unknown Playlist"
        try:
            # Try to get playlist info from Spotify API
            playlist_info = await spotify.get_playlist_info(request.playlist_id)
            if playlist_info and 'name' in playlist_info and playlist_info['name']:
                playlist_name = playlist_info['name']
                print(f"Got playlist name from API: {playlist_name}")
            elif tracks and len(tracks) > 0:
                # Fallback: try to get from first track if available
                first_track = tracks[0]
                if 'playlist_name' in first_track:
                    playlist_name = first_track['playlist_name']
                    print(f"Got playlist name from track: {playlist_name}")
        except Exception as e:
            print(f"Warning: Could not get playlist name: {e}")
            # Use default name with track count
            playlist_name = f"Playlist with {len(tracks)} tracks"
        
    except fastapi.HTTPException:
        raise
    except Exception as e:
        raise fastapi.HTTPException(status_code=400, detail=f"Failed to access playlist: {str(e)}")
    
    # Create the job record
    job = ReorderJob(
        user_id=session.user.id,
        playlist_id=request.playlist_id,
        playlist_name=playlist_name,
        reorder_style=request.reorder_style,
        user_intent=request.user_intent,
        personal_tone=request.personal_tone,
        reorder_method=request.reorder_method,
        total_tracks=len(tracks)
    )
    
    db.add(job)
    
    # Always increment total reorders for statistics
    session.user.increment_usage()
    
    db.commit()
    db.refresh(job)
    
    # Start background processing
    background_tasks.add_task(process_reorder_job_background, job.id)
    
    return {
        "status": "accepted",
        "job_id": job.id,
        "message": f"Reorder job started for playlist '{playlist_name}' with {len(tracks)} tracks",
        "estimated_time_minutes": max(1, len(tracks) // 10),  # Rough estimate
        "total_tracks": len(tracks)
    }


@router.get("/job-status/{job_id}")
async def get_job_status(job_id: str, httpRequest: Request, db: Session = Depends(get_db)):
    """Get the status of a reorder job"""
    session_id = httpRequest.cookies.get("session_id")
    if not session_id:
        raise fastapi.HTTPException(status_code=401, detail="Not authenticated")

    session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not session:
        raise fastapi.HTTPException(status_code=401, detail="Invalid session")

    job = db.query(ReorderJob).filter(
        ReorderJob.id == job_id,
        ReorderJob.user_id == session.user.id
    ).first()
    
    if not job:
        raise fastapi.HTTPException(status_code=404, detail="Job not found")

    response = {
        "job_id": job.id,
        "status": job.status,
        "progress_percentage": job.progress_percentage,
        "total_tracks": job.total_tracks,
        "processed_tracks": job.processed_tracks,
        "created_at": job.created_at.isoformat(),
        "playlist_name": job.playlist_name
    }
    
    if job.started_at:
        response["started_at"] = job.started_at.isoformat()
    
    if job.completed_at:
        response["completed_at"] = job.completed_at.isoformat()
    
    if job.status == JobStatus.COMPLETED:
        response.update({
            "success": job.success,
            "tracks_reordered": job.tracks_reordered,
            "strategy_info": job.strategy_info
        })
    elif job.status == JobStatus.FAILED:
        response["error_message"] = job.error_message
    
    return response


@router.get("/my-jobs")
async def get_my_jobs(httpRequest: Request, db: Session = Depends(get_db), 
                      limit: int = 10, offset: int = 0):
    """Get user's recent reorder jobs"""
    session_id = httpRequest.cookies.get("session_id")
    if not session_id:
        raise fastapi.HTTPException(status_code=401, detail="Not authenticated")

    session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not session:
        raise fastapi.HTTPException(status_code=401, detail="Invalid session")

    # Auto-cleanup old jobs for this user (runs every time they view history)
    try:
        deleted_count = ReorderJob.cleanup_old_jobs_for_user(db, session.user.id, days_old=30)
        if deleted_count > 0:
            print(f"Auto-cleaned up {deleted_count} old jobs for user {session.user.id}")
    except Exception as e:
        print(f"Warning: Failed to cleanup old jobs for user {session.user.id}: {e}")

    jobs = db.query(ReorderJob).filter(
        ReorderJob.user_id == session.user.id
    ).order_by(ReorderJob.created_at.desc()).offset(offset).limit(limit).all()
    
    return {
        "jobs": [
            {
                "job_id": job.id,
                "playlist_name": job.playlist_name,
                "status": job.status,
                "progress_percentage": job.progress_percentage,
                "total_tracks": job.total_tracks,
                "reorder_style": job.reorder_style,
                "created_at": job.created_at.isoformat(),
                "completed_at": job.completed_at.isoformat() if job.completed_at else None,
                "success": job.success if job.status == JobStatus.COMPLETED else None
            }
            for job in jobs
        ]
    }


@router.post("/reorder-playlist")
async def reorder_playlist(request: ReorderRequest, httpRequest: Request, db: Session = Depends(get_db)):
    session_id = httpRequest.cookies.get("session_id")
    if not session_id:
        raise fastapi.HTTPException(status_code=401, detail="Not authenticated")

    session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not session:
        raise fastapi.HTTPException(status_code=401, detail="Invalid session")

    spotify = SpotifyPlaylistOps(user=session.user)
    agent = PlaylistAgent()
    memory = VectorMemory()
    reorder_calculator = IntelligentReorderCalculator()

    # 1. Get tracks from the playlist
    tracks = await spotify.get_playlist_tracks(request.playlist_id)
    original_track_ids = [track['track_id'] for track in tracks]
    
    # Get playlist name for job record
    playlist_name = "Unknown Playlist"
    try:
        playlist_info = await spotify.get_playlist_info(request.playlist_id)
        if playlist_info and 'name' in playlist_info and playlist_info['name']:
            playlist_name = playlist_info['name']
    except Exception as e:
        print(f"Warning: Could not get playlist name: {e}")
        playlist_name = f"Playlist with {len(tracks)} tracks"
    
    # Create job record for sync mode (for history tracking)
    job = ReorderJob(
        user_id=session.user.id,
        playlist_id=request.playlist_id,
        playlist_name=playlist_name,
        reorder_style=request.reorder_style,
        user_intent=request.user_intent,
        personal_tone=request.personal_tone,
        reorder_method=request.reorder_method,
        total_tracks=len(tracks),
        status=JobStatus.IN_PROGRESS.value,
        started_at=datetime.utcnow()
    )
    
    db.add(job)
    session.user.increment_usage()
    db.commit()
    db.refresh(job)

    try:
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
            # Update job as failed - no valid analyses
            job.status = JobStatus.FAILED.value
            job.completed_at = datetime.utcnow()
            job.success = False
            job.error_message = "No valid song analyses available for reordering"
            db.commit()
            return {
                "status": "error", 
                "job_id": job.id,
                "playlist_name": playlist_name,
                "message": "No valid song analyses available for reordering."
            }
        
        print(f"Using {len(valid_analyses)} valid analyses out of {len(analyses)} total")

        # 3. Sequence the playlist with user preferences
        new_track_order = sequence_playlist(
            valid_analyses, 
            request.reorder_style, 
            request.user_intent, 
            request.personal_tone
        )

        if not new_track_order:
            # Update job as failed - reordering failed
            job.status = JobStatus.FAILED.value
            job.completed_at = datetime.utcnow()
            job.success = False
            job.error_message = "Failed to reorder playlist"
            db.commit()
            return {
                "status": "error", 
                "job_id": job.id,
                "playlist_name": playlist_name,
                "message": "Failed to reorder playlist."
            }

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
            # Update job record as completed successfully
            job.status = JobStatus.COMPLETED.value
            job.completed_at = datetime.utcnow()
            job.success = True
            job.tracks_reordered = len(new_track_order)
            job.strategy_info = str(strategy_info)
            job.progress_percentage = 100
            job.processed_tracks = len(new_track_order)
            db.commit()
            
            return {
                "status": "success", 
                "job_id": job.id,
                "playlist_name": playlist_name,
                "total_tracks": len(tracks),
                "strategy": strategy_info,
                "tracks_reordered": len(new_track_order)
            }
        else:
            # Update job record as failed
            job.status = JobStatus.FAILED.value
            job.completed_at = datetime.utcnow()
            job.success = False
            job.error_message = "Failed to apply reordering strategy"
            job.strategy_info = str(strategy_info)
            db.commit()
            
            return {
                "status": "error", 
                "job_id": job.id,
                "playlist_name": playlist_name,
                "message": "Failed to apply reordering strategy.",
                "strategy": strategy_info
            }
        
    except Exception as e:
        # Update job as failed due to unexpected error
        job.status = JobStatus.FAILED.value
        job.completed_at = datetime.utcnow()
        job.success = False
        job.error_message = f"Unexpected error during processing: {str(e)}"
        db.commit()
        
        return {
            "status": "error", 
            "job_id": job.id,
            "playlist_name": playlist_name,
            "message": f"Unexpected error occurred: {str(e)}"
        }


@router.get("/admin/job-stats")
async def get_job_stats(httpRequest: Request, db: Session = Depends(get_db)):
    """Get job statistics (admin endpoint)"""
    session_id = httpRequest.cookies.get("session_id")
    if not session_id:
        raise fastapi.HTTPException(status_code=401, detail="Not authenticated")

    session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not session:
        raise fastapi.HTTPException(status_code=401, detail="Invalid session")

    # TODO: Add admin role check when implementing user roles
    # For now, any authenticated user can view stats
    
    stats = ReorderJob.get_job_stats(db)
    return stats


@router.post("/admin/cleanup-jobs")
async def cleanup_old_jobs(httpRequest: Request, db: Session = Depends(get_db), 
                          days_old: int = 30):
    """Manually cleanup old jobs (admin endpoint)"""
    session_id = httpRequest.cookies.get("session_id")
    if not session_id:
        raise fastapi.HTTPException(status_code=401, detail="Not authenticated")

    session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not session:
        raise fastapi.HTTPException(status_code=401, detail="Invalid session")

    # TODO: Add admin role check when implementing user roles
    # For now, any authenticated user can trigger cleanup
    
    deleted_count = ReorderJob.cleanup_old_jobs(db, days_old)
    
    return {
        "status": "success",
        "deleted_count": deleted_count,
        "message": f"Cleaned up {deleted_count} jobs older than {days_old} days"
    }


@router.post("/preview-reorder")
async def preview_reorder(request: PreviewRequest, httpRequest: Request, db: Session = Depends(get_db)):
    """
    Generate a preview of how the playlist would be reordered without applying changes.
    Returns both original and new order for comparison.
    """
    session_id = httpRequest.cookies.get("session_id")
    if not session_id:
        raise fastapi.HTTPException(status_code=401, detail="Not authenticated")

    session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not session:
        raise fastapi.HTTPException(status_code=401, detail="Invalid session")

    spotify = SpotifyPlaylistOps(user=session.user)
    
    try:
        # Get playlist details
        playlist_info = await spotify.get_playlist_info(request.playlist_id)
        if not playlist_info:
            raise fastapi.HTTPException(status_code=404, detail="Playlist not found")
        
        tracks = await spotify.get_playlist_tracks(request.playlist_id)
        if not tracks:
            raise fastapi.HTTPException(status_code=404, detail="Playlist is empty")
        
        # Apply reordering logic based on style
        if request.reorder_style == "intelligent_minimal_moves":
            calculator = IntelligentReorderCalculator()
            new_order, moves_info = calculator.calculate_optimal_reorder(
                tracks, request.user_intent, request.personal_tone
            )
        else:
            # Use the existing reorder logic
            memory = VectorMemory()
            agent = PlaylistAgent()
            
            all_song_analyses = {}
            for track in tracks:
                track_id = track['track_id']
                existing_analysis = memory.get_existing_analysis(track_id)
                if existing_analysis:
                    all_song_analyses[track_id] = existing_analysis
                else:
                    # Generate analysis for preview
                    analysis = agent.analyze_song(
                        song_name=track['name'], 
                        artist_name=track['artist']
                    )
                    if 'error' not in analysis:
                        all_song_analyses[track_id] = {
                            "track_info": track,
                            "analysis": analysis
                        }
                        memory.add_song_analysis(track_info=track, analysis=analysis)
            
            final_analyses_list = list(all_song_analyses.values())
            new_track_order = sequence_playlist(final_analyses_list)
            
            # Map back to track objects with positions
            track_map = {track['track_id']: track for track in tracks}
            new_order = []
            for i, track_id in enumerate(new_track_order):
                if track_id in track_map:
                    track = track_map[track_id].copy()
                    track['position'] = i
                    track['moved_from'] = next(
                        (j for j, t in enumerate(tracks) if t['track_id'] == track_id), 
                        i
                    )
                    new_order.append(track)
        
        # Prepare original order with positions
        original_order = []
        for i, track in enumerate(tracks):
            track_copy = track.copy()
            track_copy['position'] = i
            original_order.append(track_copy)
        
        # Create strategy info
        strategy_info = {
            "method": request.reorder_method,
            "details": {
                "total_tracks": len(tracks),
                "tracks_moved": len([t for t in new_order if t.get('moved_from', t['position']) != t['position']]),
                "style": request.reorder_style
            }
        }
        
        return {
            "status": "preview_ready",
            "playlist_name": playlist_info.get('name', 'Unknown Playlist'),
            "total_tracks": len(tracks),
            "reorder_style": request.reorder_style,
            "user_intent": request.user_intent,
            "personal_tone": request.personal_tone,
            "strategy": strategy_info,
            "original_order": original_order,
            "new_order": new_order,
            "preview_id": f"preview_{request.playlist_id}_{len(tracks)}"
        }
        
    except Exception as e:
        print(f"Error generating preview: {str(e)}")
        raise fastapi.HTTPException(status_code=500, detail=f"Failed to generate preview: {str(e)}")


@router.post("/preview-reorder-comparison")
async def preview_reorder_comparison(request: PreviewRequest, httpRequest: Request, db: Session = Depends(get_db)):
    """
    Generate a detailed before/after preview comparison.
    Returns both original and new order with change analysis.
    """
    session_id = httpRequest.cookies.get("session_id")
    if not session_id:
        raise fastapi.HTTPException(status_code=401, detail="Not authenticated")

    session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not session:
        raise fastapi.HTTPException(status_code=401, detail="Invalid session")

    spotify = SpotifyPlaylistOps(user=session.user)
    
    try:
        # Get original playlist tracks
        original_tracks = await spotify.get_playlist_tracks(request.playlist_id)
        if not original_tracks:
            raise fastapi.HTTPException(status_code=404, detail="Could not fetch playlist tracks")
        
        # Get playlist info
        playlist_info = await spotify.get_playlist_info(request.playlist_id)
        playlist_name = playlist_info.get('name', 'Unknown Playlist') if playlist_info else 'Unknown Playlist'
        
        # Apply AI reordering to get new order
        new_track_order = sequence_playlist(
            song_analyses=original_tracks,
            reorder_style=request.reorder_style,
            user_intent=request.user_intent,
            personal_tone=request.personal_tone
        )
        
        # Create detailed comparison data
        original_order = []
        new_order = []
        
        # Build original order
        for i, track in enumerate(original_tracks):
            original_order.append({
                "position": i,
                "track_id": track.get('track_id'),
                "name": track.get('name'),
                "artist": track.get('artist'),
                "album_name": track.get('album_name'),
                "popularity": track.get('popularity', 0),
                "preview_url": None,  # Can be enhanced later
                "duration_ms": None   # Can be enhanced later
            })
        
        # Build new order with movement tracking
        track_lookup = {track['track_id']: i for i, track in enumerate(original_tracks)}
        
        for i, track_id in enumerate(new_track_order):
            track_data = next((t for t in original_tracks if t['track_id'] == track_id), None)
            if track_data:
                original_position = track_lookup.get(track_id, i)
                new_order.append({
                    "position": i,
                    "track_id": track_id,
                    "name": track_data.get('name'),
                    "artist": track_data.get('artist'),
                    "album_name": track_data.get('album_name'),
                    "popularity": track_data.get('popularity', 0),
                    "moved_from": original_position,
                    "preview_url": None,
                    "duration_ms": None
                })
        
        # Calculate change statistics
        tracks_moved = sum(1 for track in new_order if track.get('moved_from') != track['position'])
        
        # Calculate popularity change
        original_avg_pop = sum(track['popularity'] for track in original_order) / len(original_order) if original_order else 0
        new_avg_pop = sum(track['popularity'] for track in new_order) / len(new_order) if new_order else 0
        avg_popularity_change = new_avg_pop - original_avg_pop
        
        # Simple genre distribution improvement (placeholder)
        genre_distribution_change = min(tracks_moved * 2.5, 15.0) # Simplified calculation
        
        changes_summary = {
            "tracks_moved": tracks_moved,
            "avg_popularity_change": avg_popularity_change,
            "genre_distribution_change": genre_distribution_change
        }
        
        # Save refreshed tokens if they were updated
        db.commit()
        
        return {
            "original_order": original_order,
            "new_order": new_order,
            "playlist_name": playlist_name,
            "total_tracks": len(original_tracks),
            "strategy_info": f"Applied {request.reorder_style} style with focus on {request.user_intent}",
            "changes_summary": changes_summary
        }
        
    except Exception as e:
        print(f"Error in preview comparison: {str(e)}")
        raise fastapi.HTTPException(status_code=500, detail=f"Error generating preview: {str(e)}")


@router.put("/reorder-track")
async def reorder_track_realtime(request: ReorderTrackRequest, httpRequest: Request, db: Session = Depends(get_db)):
    """
    Reorder a single track or range of tracks in a playlist immediately.
    Uses Spotify's native reorder API for real-time updates.
    """
    session_id = httpRequest.cookies.get("session_id")
    if not session_id:
        raise fastapi.HTTPException(status_code=401, detail="Not authenticated")

    session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not session:
        raise fastapi.HTTPException(status_code=401, detail="Invalid session")

    spotify = SpotifyPlaylistOps(user=session.user)
    
    try:
        # Get current access token with automatic refresh
        headers = await spotify.get_headers()
        if not headers:
            raise fastapi.HTTPException(status_code=401, detail="Failed to get valid access token")
        
        # Call Spotify's reorder API directly
        import requests
        url = f"https://api.spotify.com/v1/playlists/{request.playlist_id}/tracks"
        
        data = {
            "range_start": request.range_start,
            "insert_before": request.insert_before,
            "range_length": request.range_length
        }
        
        if request.snapshot_id:
            data["snapshot_id"] = request.snapshot_id
        
        response = requests.put(url, headers=headers, json=data)
        
        if response.status_code == 200:
            result = response.json()
            # Save any refreshed tokens
            db.commit()
            return {
                "status": "success",
                "snapshot_id": result.get("snapshot_id"),
                "range_start": request.range_start,
                "insert_before": request.insert_before,
                "range_length": request.range_length
            }
        else:
            raise fastapi.HTTPException(
                status_code=response.status_code, 
                detail=f"Spotify API error: {response.text}"
            )
            
    except Exception as e:
        print(f"Error reordering track: {str(e)}")
        raise fastapi.HTTPException(status_code=500, detail=f"Failed to reorder track: {str(e)}")



@router.get("/playlist/{playlist_id}/tracks")
async def get_playlist_tracks_for_manual_reorder(
    playlist_id: str, 
    httpRequest: Request, 
    db: Session = Depends(get_db)
):
    """
    Get playlist tracks for manual reordering - no AI processing, just raw track data.
    Uses SpotifyPlaylistOps for automatic token refresh.
    """
    session_id = httpRequest.cookies.get("session_id")
    if not session_id:
        raise fastapi.HTTPException(status_code=401, detail="Not authenticated")

    session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not session:
        raise fastapi.HTTPException(status_code=401, detail="Invalid session")

    spotify = SpotifyPlaylistOps(user=session.user)
    
    try:
        # Get playlist info (includes token refresh if needed)
        playlist_info = await spotify.get_playlist_info(playlist_id)
        if not playlist_info:
            raise fastapi.HTTPException(status_code=404, detail="Playlist not found")
        
        # Get tracks (includes token refresh if needed)
        tracks = await spotify.get_playlist_tracks(playlist_id)
        if not tracks:
            raise fastapi.HTTPException(status_code=404, detail="Could not fetch playlist tracks")
        
        # Format tracks for manual reordering
        formatted_tracks = []
        for i, track in enumerate(tracks):
            formatted_tracks.append({
                "position": i,
                "track_id": track.get('track_id'),
                "name": track.get('name'),
                "artist": track.get('artist'),
                "album_name": track.get('album_name'),
                "popularity": track.get('popularity', 0),
                "preview_url": None,  # Can be added later if needed
                "duration_ms": None,  # Can be added later if needed
                "external_urls": None  # Can be added later if needed
            })
        
        # Save refreshed tokens if they were updated
        db.commit()
        
        return {
            "tracks": formatted_tracks,
            "total_tracks": len(formatted_tracks),
            "playlist_name": playlist_info.get('name', 'Unknown Playlist'),
            "snapshot_id": playlist_info.get('snapshot_id'),
            "showing_tracks": len(formatted_tracks)
        }
        
    except Exception as e:
        print(f"Error fetching playlist tracks: {str(e)}")
        raise fastapi.HTTPException(status_code=500, detail=f"Failed to fetch playlist tracks: {str(e)}")


@router.get("/shared-playlist/{playlist_id}")
async def get_shared_playlist(playlist_id: str):
    """
    Get public playlist information for sharing (no authentication required)
    This is used for the shared playlist view
    """
    try:
        # For shared playlists, we'll use a public Spotify API call
        # Note: This requires the playlist to be public
        import httpx
        
        # We could use a public Spotify token here, but for now let's try without auth
        # In production, you'd want to have a client credentials token
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.spotify.com/v1/playlists/{playlist_id}",
                headers={
                    "Content-Type": "application/json"
                }
            )
        
        if response.status_code == 200:
            playlist_data = response.json()
            
            # Extract tracks
            tracks = []
            if 'tracks' in playlist_data and 'items' in playlist_data['tracks']:
                for item in playlist_data['tracks']['items']:
                    if item and item.get('track'):
                        track = item['track']
                        tracks.append({
                            'track_id': track.get('id', ''),
                            'name': track.get('name', 'Unknown'),
                            'artist': ', '.join([artist.get('name', 'Unknown') for artist in track.get('artists', [])]),
                            'album': track.get('album', {}).get('name', 'Unknown'),
                            'duration_ms': track.get('duration_ms', 0)
                        })
            
            return {
                'id': playlist_data.get('id'),
                'name': playlist_data.get('name', 'Unknown Playlist'),
                'description': playlist_data.get('description', ''),
                'owner': playlist_data.get('owner', {}).get('display_name', 'Unknown'),
                'public': playlist_data.get('public', False),
                'collaborative': playlist_data.get('collaborative', False),
                'tracks': tracks
            }
        else:
            raise fastapi.HTTPException(status_code=404, detail="Playlist not found or not public")
            
    except httpx.HTTPError:
        raise fastapi.HTTPException(status_code=503, detail="Unable to fetch playlist data")
    except Exception as e:
        raise fastapi.HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
