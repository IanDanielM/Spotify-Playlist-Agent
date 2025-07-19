"""
Simplified Profile Service that works with existing database structure
"""
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from collections import Counter

from ..database.models import User
from ..database.models import ReorderJob, JobStatus


class ProfileService:
    """Service for managing user profiles and preferences"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive user profile"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        # Get basic profile info
        profile = {
            'id': user.id,
            'spotify_username': user.spotify_username,
            'spotify_display_name': user.spotify_username,  # Use username for now
            'email': user.email,
            'spotify_profile_image': None,  # Will be added when migration is complete
            'spotify_country': None,
            'spotify_followers': 0,
            'spotify_product': None,
            'created_at': user.created_at.isoformat() if getattr(user, 'created_at', None) is not None else None,
            'profile_updated_at': None,
            'preferred_reorder_style': None,
            'favorite_styles': [],
            'user_preferences': {},
            'total_reorders': user.total_reorders,
        }
        
        # Add analytics
        profile['analytics'] = self.get_user_analytics(user_id)
        
        return profile
    
    def get_user_analytics(self, user_id: str) -> Dict[str, Any]:
        """Get user's reordering analytics and statistics"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        # Get all user's reorder jobs
        jobs = self.db.query(ReorderJob).filter(ReorderJob.user_id == user_id).all()
        
        # Calculate statistics
        total_jobs = len(jobs)
        if total_jobs == 0:
            return {
                'total_reorders': 0,
                'successful_reorders': 0,
                'failed_reorders': 0,
                'success_rate': 0,
                'most_used_style': None,
                'style_usage': {},
                'recent_activity_count': 0,
                'monthly_trends': {},
                'favorite_styles': [],
                'preferred_style': None,
                'total_tracks_reordered': 0,
                'average_tracks_per_playlist': 0
            }
        
        successful_jobs = []
        failed_jobs = []
        style_usage = Counter()
        total_tracks_reordered = 0
        total_tracks_all = 0
        
        for job in jobs:
            # Check job status and success
            is_successful = (
                str(job.status) == str(JobStatus.COMPLETED) and 
                getattr(job, 'success', False)
            )
            
            if is_successful:
                successful_jobs.append(job)
                if hasattr(job, 'tracks_reordered') and getattr(job, 'tracks_reordered', None) is not None:
                    total_tracks_reordered += int(getattr(job, 'tracks_reordered', 0) or 0)
                if hasattr(job, 'total_tracks') and getattr(job, 'total_tracks', None) is not None:
                    total_tracks_all += int(getattr(job, 'total_tracks', 0) or 0)
            else:
                failed_jobs.append(job)
            
            # Count style usage
            if hasattr(job, 'reorder_style') and getattr(job, 'reorder_style', None):
                style_usage[job.reorder_style] += 1
        
        most_used_style = style_usage.most_common(1)[0][0] if style_usage else None
        
        # Recent activity (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_jobs = []
        for job in jobs:
            if hasattr(job, 'created_at') and getattr(job, 'created_at', None) is not None:
                try:
                    if job.created_at > thirty_days_ago:
                        recent_jobs.append(job)
                except:
                    pass  # Skip if comparison fails
        
        # Success rate
        success_rate = (len(successful_jobs) / total_jobs * 100) if total_jobs > 0 else 0
        
        # Average tracks per playlist
        # Ensure average_tracks is a float, not a SQLAlchemy column type
        try:
            average_tracks = float(total_tracks_all) / float(len(successful_jobs)) if successful_jobs else 0.0
        except Exception:
            average_tracks = 0.0
        
        return {
            'total_reorders': total_jobs,
            'successful_reorders': len(successful_jobs),
            'failed_reorders': len(failed_jobs),
            'success_rate': round(success_rate, 1),
            'most_used_style': most_used_style,
            'style_usage': dict(style_usage),
            'recent_activity_count': len(recent_jobs),
            'monthly_trends': self._calculate_monthly_trends(jobs),
            'favorite_styles': [],  # Will be populated when preferences are properly stored
            'preferred_style': None,  # Will be populated when preferences are properly stored
            'total_tracks_reordered': total_tracks_reordered,
            'average_tracks_per_playlist': round(average_tracks) if average_tracks and average_tracks > 0 else 0
        }
    
    def _calculate_monthly_trends(self, jobs: List[ReorderJob]) -> Dict[str, Any]:
        """Calculate monthly usage trends"""
        if not jobs:
            return {}
        
        # Group jobs by month
        monthly_data = {}
        for job in jobs:
            try:
                if hasattr(job, 'created_at') and job.created_at:
                    month_key = job.created_at.strftime('%Y-%m')
                    if month_key not in monthly_data:
                        monthly_data[month_key] = {
                            'total': 0,
                            'successful': 0,
                            'failed': 0,
                            'styles': Counter()
                        }
                    
                    monthly_data[month_key]['total'] += 1
                    
                    is_successful = (
                        str(job.status) == str(JobStatus.COMPLETED) and 
                        getattr(job, 'success', False)
                    )
                    
                    if is_successful:
                        monthly_data[month_key]['successful'] += 1
                    else:
                        monthly_data[month_key]['failed'] += 1
                    
                    if hasattr(job, 'reorder_style') and job.reorder_style:
                        monthly_data[month_key]['styles'][job.reorder_style] += 1
            except:
                continue  # Skip jobs with date issues
        
        return monthly_data
    
    async def update_user_profile_from_spotify(self, user_id: str) -> Dict[str, Any]:
        """Update user profile with fresh data from Spotify API (placeholder)"""
        # This will be implemented when Spotify profile integration is complete
        return self.get_user_profile(user_id)
