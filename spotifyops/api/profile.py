from datetime import datetime
from typing import Any, Dict, Optional

import fastapi
from fastapi import Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from spotifyops.database.models import Session as DbSession
from spotifyops.database.models import User, get_db
from spotifyops.services.profile_service_simple import ProfileService

router = fastapi.APIRouter()

# Request models for profile updates
class ProfileUpdateRequest(BaseModel):
    spotify_username: Optional[str] = None
    email: Optional[str] = None

class StyleRequest(BaseModel):
    style: str

# Helper function to get authenticated user
def get_authenticated_user(httpRequest: Request, db: Session) -> User:
    """Get authenticated user from session"""
    session_id = httpRequest.cookies.get("session_id")
    if not session_id:
        raise fastapi.HTTPException(status_code=401, detail="Not authenticated")

    session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not session:
        raise fastapi.HTTPException(status_code=401, detail="Invalid session")

    return session.user


@router.get("/me/profile")
async def get_user_profile(httpRequest: Request, db: Session = Depends(get_db)):
    """Get current user's comprehensive profile information, including onboarding state"""
    user = get_authenticated_user(httpRequest, db)
    profile_service = ProfileService(db)
    
    # Get comprehensive profile with analytics
    profile = profile_service.get_user_profile(str(user.id))
    return profile


@router.put("/me/profile")


# Endpoint to get onboarding state only
@router.get("/me/onboarding-state")
async def get_onboarding_state(httpRequest: Request, db: Session = Depends(get_db)):
    """Get whether the user has completed onboarding"""
    user = get_authenticated_user(httpRequest, db)
    return {"onboarding_completed": user.has_completed_onboarding()}

# Endpoint to set onboarding as completed (or reset)
class OnboardingStateRequest(BaseModel):
    completed: bool = True

@router.post("/me/onboarding-state")
async def set_onboarding_state(
    request: OnboardingStateRequest,
    httpRequest: Request,
    db: Session = Depends(get_db)
):
    """Set onboarding completed state for the user"""
    user = get_authenticated_user(httpRequest, db)
    user.set_onboarding_completed(request.completed)
    db.commit()
    return {"onboarding_completed": user.has_completed_onboarding()}

@router.get("/me/usage")
async def get_user_usage(httpRequest: Request, db: Session = Depends(get_db)):
    """Get current user's usage statistics"""
    user = get_authenticated_user(httpRequest, db)
    
    return {
        "total_reorders": user.total_reorders,
        "can_reorder": True,
        "message": "Ready to reorder playlists"
    }

@router.put("/me/profile")
async def update_user_profile(
    request: ProfileUpdateRequest,
    httpRequest: Request,
    db: Session = Depends(get_db)
):
    """Update user profile information"""
    user = get_authenticated_user(httpRequest, db)
    
    if request.spotify_username is not None:
        user.spotify_username = request.spotify_username
    if request.email is not None:
        user.email = request.email
    
    db.commit()
    
    return {
        "message": "Profile updated successfully",
        "spotify_username": user.spotify_username,
        "email": user.email
    }

# Enhanced Profile Endpoints

@router.post("/me/refresh-spotify-profile")
async def refresh_spotify_profile(httpRequest: Request, db: Session = Depends(get_db)):
    """Refresh user profile with latest data from Spotify API"""
    user = get_authenticated_user(httpRequest, db)
    profile_service = ProfileService(db)
    
    try:
        updated_profile = await profile_service.update_user_profile_from_spotify(str(user.id))
        return {
            "message": "Profile refreshed successfully",
            "profile": updated_profile
        }
    except Exception as e:
        raise fastapi.HTTPException(status_code=500, detail=f"Failed to refresh profile: {str(e)}")

@router.get("/me/analytics")
async def get_user_analytics(httpRequest: Request, db: Session = Depends(get_db)):
    """Get user's reordering analytics and statistics"""
    user = get_authenticated_user(httpRequest, db)
    
    # Get all user's reorder jobs for analytics
    from spotifyops.database.job_models import JobStatus, ReorderJob
    
    jobs = db.query(ReorderJob).filter(ReorderJob.user_id == str(user.id)).all()
    
    # Calculate basic statistics
    total_jobs = len(jobs)
    successful_jobs = [job for job in jobs if job.status == JobStatus.COMPLETED.value and job.success]
    failed_jobs = [job for job in jobs if job.status == JobStatus.FAILED.value or not job.success]
    
    # Style usage analysis
    from collections import Counter
    style_usage = Counter([job.reorder_style for job in successful_jobs])
    most_used_style = style_usage.most_common(1)[0][0] if style_usage else None
    
    # Recent activity (last 30 days)
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_jobs = [job for job in jobs if job.created_at and job.created_at > thirty_days_ago]
    
    # Success rate
    success_rate = (len(successful_jobs) / total_jobs * 100) if total_jobs > 0 else 0
    
    return {
        'total_reorders': total_jobs,
        'successful_reorders': len(successful_jobs),
        'failed_reorders': len(failed_jobs),
        'success_rate': round(success_rate, 1),
        'most_used_style': most_used_style,
        'style_usage': dict(style_usage),
        'recent_activity_count': len(recent_jobs),
        'monthly_trends': {},  # Simplified for now
        'favorite_styles': [],  # Will be populated from user preferences
        'preferred_style': None,  # Will be populated from user preferences
        'total_tracks_reordered': sum(job.tracks_reordered or 0 for job in successful_jobs),
        'average_tracks_per_playlist': round(
            sum(job.total_tracks or 0 for job in successful_jobs) / len(successful_jobs)
        ) if successful_jobs else 0
    }

@router.get("/me/recommendations")
async def get_user_recommendations(httpRequest: Request, db: Session = Depends(get_db)):
    """Get personalized recommendations for the user"""
    user = get_authenticated_user(httpRequest, db)
    
    # Get analytics data for recommendations
    from spotifyops.database.job_models import JobStatus, ReorderJob
    jobs = db.query(ReorderJob).filter(ReorderJob.user_id == str(user.id)).all()
    
    successful_jobs = [job for job in jobs if job.status == JobStatus.COMPLETED.value and job.success]
    total_jobs = len(jobs)
    success_rate = (len(successful_jobs) / total_jobs * 100) if total_jobs > 0 else 0
    
    recommendations = {
        'recommended_styles': [],
        'tips': [],
        'insights': []
    }
    
    # Style recommendations based on usage
    if successful_jobs:
        from collections import Counter
        style_usage = Counter([job.reorder_style for job in successful_jobs])
        most_used_style = style_usage.most_common(1)[0][0] if style_usage else None
        
        if most_used_style:
            # Simple style recommendations
            similar_styles = {
                'energy': ['tempo', 'mood', 'vibe'],
                'genre': ['artist', 'similarity', 'style'],
                'chronological': ['release_date', 'era', 'decade'],
                'mood': ['energy', 'vibe', 'emotion'],
                'tempo': ['energy', 'bpm', 'rhythm'],
            }.get(most_used_style, ['genre', 'mood', 'energy'])
            
            recommendations['recommended_styles'] = similar_styles[:3]
    
    # Personalized tips
    if success_rate < 80:
        recommendations['tips'].append(
            "Try using more specific intent descriptions for better results."
        )
    
    if total_jobs > 10:
        recommendations['tips'].append(
            "Consider setting a preferred reordering style to speed up your workflow."
        )
    
    # Insights
    total_tracks = sum(job.tracks_reordered or 0 for job in successful_jobs)
    if total_tracks > 100:
        recommendations['insights'].append(
            f"You've reordered {total_tracks} tracks! You're becoming a playlist pro."
        )
    
    if len(successful_jobs) > 5:
        recommendations['insights'].append(
            f"Your success rate is {round(success_rate, 1)}%. Keep up the great work!"
        )
    
    return recommendations

@router.post("/me/refresh-spotify-profile")
async def refresh_spotify_profile(httpRequest: Request, db: Session = Depends(get_db)):
    """Refresh user profile data from Spotify"""
    user = get_authenticated_user(httpRequest, db)
    
    try:
        # Try to get fresh profile data from Spotify
        from spotifyops.tools.spotify import SpotifyPlaylistOps
        spotify_api = SpotifyPlaylistOps(user)
        profile_data = await spotify_api.get_current_user_profile()
        
        if profile_data:
            # Update basic profile info that we can store
            if 'display_name' in profile_data:
                user.spotify_username = profile_data['display_name']
            if 'email' in profile_data:
                user.email = profile_data['email']
            
            db.commit()
            
            return {
                "message": "Profile refreshed successfully",
                "profile_data": profile_data
            }
        else:
            return {
                "message": "Could not refresh profile data",
                "error": "Unable to fetch from Spotify"
            }
    
    except Exception as e:
        return {
            "message": "Profile refresh failed",
            "error": str(e)
        }
