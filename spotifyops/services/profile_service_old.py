"""
Enhanced User Profile Service
Handles user profile management, preferences, and analytics
"""
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from collections import Counter

from ..database.models import User
from ..database.job_models import ReorderJob, JobStatus
from ..tools.spotify import SpotifyPlaylistOps


class ProfileService:
    """Service for managing user profiles and preferences"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def update_user_profile_from_spotify(self, user_id: str) -> Dict[str, Any]:
        """Update user profile with fresh data from Spotify API"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        try:
            # Get tokens and initialize Spotify API
            access_token, refresh_token = user.get_tokens()
            spotify_api = SpotifyPlaylistOps(user)
            
            # Fetch current user profile from Spotify
            profile_data = await spotify_api.get_current_user_profile()
            
            if profile_data:
                # Update user profile
                user.update_spotify_profile(profile_data)
                self.db.commit()
            else:
                raise ValueError("Unable to fetch profile data from Spotify")
            
            return user.to_profile_dict()
            
        except Exception as e:
            print(f"Error updating profile from Spotify: {e}")
            raise
    
    def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive user profile"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        profile = user.to_profile_dict()
        
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
        
        for job in jobs:
            if hasattr(job, 'status') and hasattr(job, 'success'):
                if job.status == JobStatus.COMPLETED and job.success:
                    successful_jobs.append(job)
                elif job.status == JobStatus.FAILED or not job.success:
                    failed_jobs.append(job)
        
        # Style usage analysis
        style_usage = Counter()
        for job in successful_jobs:
            if hasattr(job, 'reorder_style') and job.reorder_style:
                style_usage[job.reorder_style] += 1
        
        most_used_style = style_usage.most_common(1)[0][0] if style_usage else None
        
        # Recent activity (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_jobs = []
        for job in jobs:
            if hasattr(job, 'created_at') and job.created_at and job.created_at > thirty_days_ago:
                recent_jobs.append(job)
        
        # Success rate
        success_rate = (len(successful_jobs) / total_jobs * 100) if total_jobs > 0 else 0
        
        # Total tracks reordered
        total_tracks_reordered = 0
        total_tracks_all = 0
        for job in successful_jobs:
            if hasattr(job, 'tracks_reordered') and job.tracks_reordered:
                total_tracks_reordered += job.tracks_reordered
            if hasattr(job, 'total_tracks') and job.total_tracks:
                total_tracks_all += job.total_tracks
        
        average_tracks = (total_tracks_all / len(successful_jobs)) if successful_jobs else 0
        
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
            'average_tracks_per_playlist': round(average_tracks) if average_tracks > 0 else 0
        }
    
    def _calculate_monthly_trends(self, jobs: List[ReorderJob]) -> Dict[str, Any]:
        """Calculate monthly usage trends"""
        if not jobs:
            return {}
        
        # Group jobs by month
        monthly_data = {}
        for job in jobs:
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
                if hasattr(job, 'status') and hasattr(job, 'success'):
                    if job.status == JobStatus.COMPLETED and job.success:
                        monthly_data[month_key]['successful'] += 1
                    else:
                        monthly_data[month_key]['failed'] += 1
                
                if hasattr(job, 'reorder_style') and job.reorder_style:
                    monthly_data[month_key]['styles'][job.reorder_style] += 1
        
        return monthly_data
    
    def update_user_preferences(self, user_id: str, preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Update user preferences"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        user.update_user_preferences(preferences)
        self.db.commit()
        
        return user.to_profile_dict()
    
    def set_preferred_reorder_style(self, user_id: str, style: str) -> Dict[str, Any]:
        """Set user's preferred reordering style"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        user.preferred_reorder_style = style
        self.db.commit()
        
        return user.to_profile_dict()
    
    def add_favorite_style(self, user_id: str, style: str) -> Dict[str, Any]:
        """Add a style to user's favorites"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        user.add_favorite_style(style)
        self.db.commit()
        
        return user.to_profile_dict()
    
    def remove_favorite_style(self, user_id: str, style: str) -> Dict[str, Any]:
        """Remove a style from user's favorites"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        user.remove_favorite_style(style)
        self.db.commit()
        
        return user.to_profile_dict()
    
    def get_user_recommendations(self, user_id: str) -> Dict[str, Any]:
        """Get personalized recommendations for the user"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        analytics = self.get_user_analytics(user_id)
        
        recommendations = {
            'recommended_styles': [],
            'tips': [],
            'insights': []
        }
        
        # Style recommendations based on usage
        if analytics['most_used_style']:
            similar_styles = self._get_similar_styles(analytics['most_used_style'])
            recommendations['recommended_styles'] = similar_styles
        
        # Personalized tips
        if analytics['success_rate'] < 80:
            recommendations['tips'].append(
                "Try using more specific intent descriptions for better results."
            )
        
        if analytics['total_reorders'] > 10 and not user.preferred_reorder_style:
            recommendations['tips'].append(
                "Set a preferred reordering style to speed up your workflow."
            )
        
        # Insights
        if analytics['total_tracks_reordered'] > 100:
            recommendations['insights'].append(
                f"You've reordered {analytics['total_tracks_reordered']} tracks! "
                f"Your most efficient style is '{analytics['most_used_style']}'."
            )
        
        return recommendations
    
    def _get_similar_styles(self, style: str) -> List[str]:
        """Get styles similar to the given style"""
        # This is a simplified implementation
        # In a real system, this could use ML to find similar styles
        style_groups = {
            'energy': ['energy', 'tempo', 'mood', 'vibe'],
            'genre': ['genre', 'style', 'artist', 'similarity'],
            'chronological': ['chronological', 'release_date', 'era', 'decade'],
            'mood': ['mood', 'energy', 'vibe', 'emotion'],
            'tempo': ['tempo', 'energy', 'bpm', 'rhythm'],
        }
        
        for group, styles in style_groups.items():
            if style in styles:
                return [s for s in styles if s != style]
        
        return []
