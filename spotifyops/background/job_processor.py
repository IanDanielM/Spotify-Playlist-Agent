"""
Background task handlers for async playlist reordering
"""
import json
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from spotifyops.agent.playlist_agent import PlaylistAgent
from spotifyops.database.models import get_db, User
from spotifyops.database.models import ReorderJob, JobStatus
from spotifyops.logic.reorder_logic import sequence_playlist
from spotifyops.logic.intelligent_reorder import IntelligentReorderCalculator
from spotifyops.logic.embedding_store import VectorMemory
from spotifyops.tools.spotify import SpotifyPlaylistOps


class ReorderJobProcessor:
    """Handles the async processing of playlist reorder jobs"""
    
    def __init__(self):
        self.agent = PlaylistAgent()
        self.memory = VectorMemory()
        self.reorder_calculator = IntelligentReorderCalculator()
    
    async def process_reorder_job(self, job_id: str, db: Session):
        """Process a single reorder job"""
        job = None
        try:
            # Get the job from database
            job = db.query(ReorderJob).filter(ReorderJob.id == job_id).first()
            if not job:
                print(f"Job {job_id} not found")
                return
            
            # Update job status to in_progress
            job.status = JobStatus.IN_PROGRESS
            job.started_at = datetime.utcnow()
            job.progress_percentage = 5
            db.commit()
            
            print(f"Starting job {job_id} for playlist {job.playlist_id}")
            
            # Get user and initialize Spotify client
            user = db.query(User).filter(User.id == job.user_id).first()
            if not user:
                await self._fail_job(job, "User not found", db)
                return
            
            try:
                spotify = SpotifyPlaylistOps(user=user)
            except Exception as e:
                print(f"Failed to initialize Spotify client: {e}")
                await self._fail_job(job, f"Failed to initialize Spotify client: {str(e)}", db)
                return
            
            # 1. Get tracks from the playlist
            try:
                tracks = await spotify.get_playlist_tracks(job.playlist_id)
                if not tracks:
                    await self._fail_job(job, "Playlist not found or empty", db)
                    return

                # Update job with actual track count
                job.total_tracks = len(tracks)
                job.processed_tracks = 0
                job.progress_percentage = 10

                if not job.playlist_name or job.playlist_name == "Unknown Playlist":
                    try:
                        playlist_info = await spotify.get_playlist_info(job.playlist_id)
                        if playlist_info and 'name' in playlist_info:
                            job.playlist_name = playlist_info['name']
                    except Exception as e:
                        print(f"Warning: Could not update playlist name for job {job.id}: {e}")

                try:
                    db.commit()
                except Exception as e:
                    print(f"Warning: Failed to commit track count update for job {job.id}: {e}")
                    
                print(f"Found {len(tracks)} tracks in playlist")
            except Exception as e:
                print(f"Failed to get playlist tracks: {e}")
                await self._fail_job(job, f"Failed to get playlist tracks: {str(e)}", db)
                return
            
            # 2. Analyze tracks with progress updates
            analyses = await self._analyze_tracks_with_progress(tracks, job, db)
            if not analyses:
                await self._fail_job(job, "No valid song analyses available", db)
                return
            
            job.progress_percentage = 60
            db.commit()
            
            # 3. Sequence the playlist
            print(f"Job {job_id}: Sequencing playlist with {len(analyses)} analyses")
            new_track_order = sequence_playlist(
                analyses, 
                job.reorder_style, 
                job.user_intent, 
                job.personal_tone
            )
            
            if not new_track_order:
                await self._fail_job(job, "Failed to generate new track order", db)
                return
            
            job.progress_percentage = 80
            db.commit()
            
            # 4. Apply reordering strategy
            original_track_ids = [track['track_id'] for track in tracks]
            success, strategy_info = await self._apply_reorder_strategy(
                spotify, job, original_track_ids, new_track_order
            )
            
            if success:
                # Mark job as completed
                job.status = JobStatus.COMPLETED
                job.completed_at = datetime.utcnow()
                job.success = True
                job.progress_percentage = 100
                
                # Calculate actual tracks reordered based on strategy
                tracks_reordered = 0
                if "move_count" in strategy_info:
                    # Use the move count from the intelligent reorder calculator
                    tracks_reordered = strategy_info["move_count"]
                elif "moves" in strategy_info and isinstance(strategy_info["moves"], list):
                    # For intelligent moves, count the number of actual moves
                    tracks_reordered = len(strategy_info["moves"])
                elif strategy_info.get("method") == "full_rewrite":
                    # For full rewrite, compare original vs new order to count actual changes
                    tracks_reordered = sum(1 for i, track_id in enumerate(new_track_order) 
                                         if i >= len(original_track_ids) or original_track_ids[i] != track_id)
                else:
                    # Default fallback
                    tracks_reordered = len([i for i, (orig, new) in enumerate(zip(original_track_ids, new_track_order)) if orig != new])
                
                job.tracks_reordered = tracks_reordered
                
                # Convert strategy_info to JSON-serializable format
                try:
                    serializable_strategy_info = self._make_json_serializable(strategy_info)
                    job.strategy_info = json.dumps(serializable_strategy_info)
                except Exception as e:
                    print(f"Warning: Could not serialize strategy_info: {e}")
                    job.strategy_info = json.dumps({"method": strategy_info.get("method", "unknown")})
                
                print(f"Job {job_id}: Completed successfully with {tracks_reordered} tracks reordered")
            else:
                await self._fail_job(job, "Failed to apply reordering strategy", db)
            
            db.commit()
            
        except Exception as e:
            print(f"Job {job_id}: Unexpected error: {str(e)}")
            import traceback
            traceback.print_exc()
            if job:
                await self._fail_job(job, f"Unexpected error: {str(e)}", db)
            else:
                print(f"Job {job_id}: Could not mark as failed - job not found")
    
    async def _analyze_tracks_with_progress(self, tracks: List[Dict], job: ReorderJob, db: Session) -> List[Dict]:
        """Analyze tracks with progress updates"""
        analyses = []
        total_tracks = len(tracks)
        batch_size = 5  # Process in batches to avoid blocking
        
        for i, track in enumerate(tracks):
            track_id = track['track_id']
            
            # Check cache first
            existing_analysis = self.memory.get_existing_analysis(track_id)
            if existing_analysis:
                analyses.append(existing_analysis)
            else:
                # Analyze the song
                analysis = self.agent.analyze_song(track['name'], track['artist'])
                
                if 'error' not in analysis:
                    song_analysis = {
                        "track_info": track,
                        "analysis": analysis
                    }
                    analyses.append(song_analysis)
                    self.memory.add_song_analysis(track_info=track, analysis=analysis)
                else:
                    # Fallback analysis
                    fallback_analysis = {
                        "analysis_summary": f"Track: {track['name']} by {track['artist']}",
                        "narrative_category": "Unknown",
                        "emotional_tone": "Neutral"
                    }
                    analyses.append({
                        "track_info": track,
                        "analysis": fallback_analysis
                    })
            
            progress = 10 + int((i + 1) / total_tracks * 50)
            job.processed_tracks = i + 1
            job.progress_percentage = progress
            
            if (i + 1) % batch_size == 0 or i == total_tracks - 1:
                try:
                    db.commit()
                    if i < total_tracks - 1:
                        import asyncio
                        await asyncio.sleep(0.1)  # 100ms delay between batches
                except Exception as e:
                    print(f"Warning: Failed to commit progress for job {job.id}: {e}")
                    # Continue processing even if commit fails
        
        # Filter valid analyses
        valid_analyses = [
            analysis for analysis in analyses 
            if 'error' not in analysis.get('analysis', {})
        ]
        
        return valid_analyses
    
    async def _apply_reorder_strategy(self, spotify: SpotifyPlaylistOps, job: ReorderJob, 
                                    original_track_ids: List[str], new_track_order: List[str]) -> tuple[bool, Dict[str, Any]]:
        """Apply the reordering strategy"""
        strategy_info = {"method": job.reorder_method}
        
        try:
            if job.reorder_method == "auto":
                strategy_result = self.reorder_calculator.calculate_reorder_strategy(
                    original_track_ids, new_track_order
                )
                chosen_strategy = strategy_result["strategy"]
                strategy_info.update(strategy_result)
            elif job.reorder_method == "intelligent":
                chosen_strategy = "intelligent_moves"
                strategy_result = self.reorder_calculator.calculate_reorder_strategy(
                    original_track_ids, new_track_order
                )
                strategy_info.update(strategy_result)
            else:
                chosen_strategy = "full_rewrite"
            
            strategy_info["method"] = chosen_strategy
            
            # Apply the strategy
            if chosen_strategy == "intelligent_moves" and "moves" in strategy_info:
                moves = strategy_info.get("moves", [])
                if moves and isinstance(moves, list):
                    success = await spotify.apply_intelligent_reorder(job.playlist_id, moves)
                else:
                    success = await spotify.update_playlist_track_order(job.playlist_id, new_track_order)
                    strategy_info["method"] = "full_rewrite"
                    strategy_info["reason"] = "No intelligent moves calculated, using full rewrite"
            else:
                success = await spotify.update_playlist_track_order(job.playlist_id, new_track_order)
            
            return success, strategy_info
            
        except Exception as e:
            strategy_info["error"] = str(e)
            return False, strategy_info
    
    async def _fail_job(self, job: ReorderJob, error_message: str, db: Session):
        """Mark a job as failed"""
        job.status = JobStatus.FAILED
        job.completed_at = datetime.utcnow()
        job.success = False
        job.error_message = error_message
        db.commit()
        print(f"Job {job.id}: Failed - {error_message}")
    
    def _make_json_serializable(self, obj):
        """Convert objects to JSON-serializable format"""
        if isinstance(obj, dict):
            return {k: self._make_json_serializable(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._make_json_serializable(item) for item in obj]
        elif hasattr(obj, '__dict__'):
            return {k: self._make_json_serializable(v) for k, v in obj.__dict__.items()}
        elif hasattr(obj, '_asdict'):
            return self._make_json_serializable(obj._asdict())
        else:
            try:
                json.dumps(obj)
                return obj
            except (TypeError, ValueError):
                return str(obj)


# Global processor instance
job_processor = ReorderJobProcessor()


async def process_reorder_job_background(job_id: str):
    """Background task wrapper for job processing"""
    print(f"Background task starting for job {job_id}")
    
    db = next(get_db())
    
    try:
        await job_processor.process_reorder_job(job_id, db)
        print(f"Background task completed for job {job_id}")
    except Exception as e:
        print(f"Background task failed for job {job_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        
        try:
            job = db.query(ReorderJob).filter(ReorderJob.id == job_id).first()
            if job:
                job.status = JobStatus.FAILED
                job.completed_at = datetime.utcnow()
                job.success = False
                job.error_message = f"Background task error: {str(e)}"
                db.commit()
                print(f"Marked job {job_id} as failed due to background task error")
        except Exception as inner_e:
            print(f"Failed to mark job {job_id} as failed: {str(inner_e)}")
    finally:
        try:
            db.close()
        except Exception as e:
            print(f"Warning: Failed to close database connection for job {job_id}: {e}")
