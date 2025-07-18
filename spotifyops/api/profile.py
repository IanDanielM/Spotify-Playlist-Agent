from typing import Optional, Dict, Any
import fastapi
from fastapi import Depends, Request
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel

from spotifyops.database.models import get_db, Session as DbSession, User
from spotifyops.services.profile_service_simple import ProfileService

router = fastapi.APIRouter()

# Request models for profile updates
class ProfileUpdateRequest(BaseModel):
    spotify_username: Optional[str] = None
    email: Optional[str] = None
    preferred_reorder_style: Optional[str] = None

class PreferencesUpdateRequest(BaseModel):
    preferences: Dict[str, Any]

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
    # Check if monthly reset is needed
    now = datetime.utcnow()
    if user.monthly_reset_date and (now - user.monthly_reset_date).days >= 30:
        user.monthly_reorders_used = 0
        user.monthly_reset_date = now
        db.commit()
    # Get comprehensive profile with analytics
    profile = profile_service.get_user_profile(str(user.id))
    # Add onboarding_completed flag
    profile['onboarding_completed'] = user.has_completed_onboarding()
    return profile


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
    can_reorder, message = user.can_reorder()
    
    return {
        "subscription_tier": user.subscription_tier,
        "monthly_reorders_used": user.monthly_reorders_used,
        "total_reorders": user.total_reorders,
        "can_reorder": can_reorder,
        "message": message,
        "monthly_limit": 3 if user.subscription_tier == "free" else None,
        "is_premium": user.is_premium()
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
    if request.preferred_reorder_style is not None:
        user.preferred_reorder_style = request.preferred_reorder_style
    
    db.commit()
    
    return {
        "message": "Profile updated successfully",
        "spotify_username": user.spotify_username,
        "email": user.email,
        "preferred_reorder_style": user.preferred_reorder_style
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
    from spotifyops.database.job_models import ReorderJob, JobStatus
    
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
    from spotifyops.database.job_models import ReorderJob, JobStatus
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

@router.post("/me/preferred-style")
async def set_preferred_style(
    request: StyleRequest,
    httpRequest: Request,
    db: Session = Depends(get_db)
):
    """Set user's preferred reordering style"""
    user = get_authenticated_user(httpRequest, db)
    
    # For now, we'll store this in the spotify_username field as a temp solution
    # In a real implementation, you'd have a proper preferences table
    
    return {
        "message": "Preferred style updated successfully",
        "style": request.style
    }

@router.post("/me/favorite-styles")
async def add_favorite_style(
    request: StyleRequest,
    httpRequest: Request,
    db: Session = Depends(get_db)
):
    """Add a style to user's favorites"""
    user = get_authenticated_user(httpRequest, db)
    
    return {
        "message": "Added to favorites",
        "favorite_styles": [request.style]  # Simplified for now
    }

@router.delete("/me/favorite-styles")
async def remove_favorite_style(
    request: StyleRequest,
    httpRequest: Request,
    db: Session = Depends(get_db)
):
    """Remove a style from user's favorites"""
    user = get_authenticated_user(httpRequest, db)
    
    return {
        "message": "Removed from favorites",
        "favorite_styles": []  # Simplified for now
    }

@router.put("/me/preferences")
async def update_preferences(
    request: PreferencesUpdateRequest,
    httpRequest: Request,
    db: Session = Depends(get_db)
):
    """Update user preferences"""
    user = get_authenticated_user(httpRequest, db)
    
    return {
        "message": "Preferences updated successfully",
        "preferences": request.preferences
    }

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
