from sqlalchemy import create_engine, Column, String, LargeBinary, Boolean, ForeignKey, DateTime, Integer, Text, JSON
from sqlalchemy.orm import sessionmaker, relationship, Session
from sqlalchemy.ext.declarative import declarative_base
from cryptography.fernet import Fernet
from datetime import datetime, timedelta, timezone
import os
import json
import enum
import uuid
from dotenv import load_dotenv

load_dotenv()

# Generate a key for encryption. Store it persistently.
def get_or_create_encryption_key():
    key_file = "encryption.key"
    if os.path.exists(key_file):
        with open(key_file, "rb") as f:
            return f.read()
    else:
        # Generate new key and save it
        key = Fernet.generate_key()
        with open(key_file, "wb") as f:
            f.write(key)
        return key

# Use environment variable if set, otherwise use persistent key file
ENCRYPTION_KEY = os.environ.get("ENCRYPTION_KEY")
if ENCRYPTION_KEY:
    cipher_suite = Fernet(ENCRYPTION_KEY.encode())
else:
    key = get_or_create_encryption_key()
    cipher_suite = Fernet(key)

Base = declarative_base()

class JobStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class User(Base):
    __tablename__ = 'users'
    id = Column(String, primary_key=True)
    encrypted_access_token = Column(LargeBinary)
    encrypted_refresh_token = Column(LargeBinary)
    
    # User profile info
    spotify_username = Column(String, nullable=True)  # Spotify display name
    email = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    spotify_profile_image = Column(String, nullable=True)
    spotify_display_name = Column(String, nullable=True)
    spotify_country = Column(String, nullable=True)
    spotify_followers = Column(Integer, nullable=True)
    spotify_product = Column(String, nullable=True)
    profile_updated_at = Column(DateTime, nullable=True)
    
    # User preferences storage
    preferred_reorder_style = Column(String, nullable=True)
    favorite_styles = Column(JSON, nullable=True)
    user_preferences = Column(JSON, nullable=True)
    
    # Usage tracking
    total_reorders = Column(Integer, default=0)

    # Relationship to reorder jobs
    reorder_jobs = relationship("ReorderJob", back_populates="user")

    def set_tokens(self, access_token, refresh_token):
        self.encrypted_access_token = cipher_suite.encrypt(access_token.encode())
        self.encrypted_refresh_token = cipher_suite.encrypt(refresh_token.encode())

    def get_tokens(self):
        try:
            if self.encrypted_access_token is None or self.encrypted_refresh_token is None:
                raise ValueError("No tokens available")
            
            access_token = cipher_suite.decrypt(self.encrypted_access_token).decode()
            refresh_token = cipher_suite.decrypt(self.encrypted_refresh_token).decode()
            return access_token, refresh_token
        except Exception as e:
            # Tokens were encrypted with a different key - force re-authentication
            print(f"Token decryption failed: {e}")
            raise ValueError("Invalid tokens - re-authentication required")
    
    def increment_usage(self):
        """Increment usage counters"""
        self.total_reorders += 1
    
    def update_spotify_profile(self, profile_data: dict):
        """Update user profile with Spotify data"""
        if 'display_name' in profile_data:
            self.spotify_display_name = profile_data['display_name']
        if 'email' in profile_data:
            self.email = profile_data['email']
        if 'country' in profile_data:
            self.spotify_country = profile_data['country']
        if 'followers' in profile_data and 'total' in profile_data['followers']:
            self.spotify_followers = profile_data['followers']['total']
        if 'product' in profile_data:
            self.spotify_product = profile_data['product']
        if 'images' in profile_data and profile_data['images']:
            # Use the first (highest quality) image
            self.spotify_profile_image = profile_data['images'][0]['url']
        
        self.profile_updated_at = datetime.utcnow()
    
    def get_user_preferences(self) -> dict:
        """Get user preferences as dictionary"""
        if self.user_preferences is None:
            return {}
        return self.user_preferences if isinstance(self.user_preferences, dict) else {}
    
    def update_user_preferences(self, preferences: dict):
        """Update user preferences"""
        current_prefs = self.get_user_preferences()
        current_prefs.update(preferences)
        self.user_preferences = current_prefs
    
    def get_favorite_styles(self) -> list:
        """Get user's favorite reordering styles"""
        if self.favorite_styles is None:
            return []
        return self.favorite_styles if isinstance(self.favorite_styles, list) else []
    
    def add_favorite_style(self, style: str):
        """Add a reordering style to favorites"""
        current_favorites = self.get_favorite_styles()
        if style not in current_favorites:
            current_favorites.append(style)
            self.favorite_styles = current_favorites
    
    def remove_favorite_style(self, style: str):
        """Remove a reordering style from favorites"""
        current_favorites = self.get_favorite_styles()
        if style in current_favorites:
            current_favorites.remove(style)
            self.favorite_styles = current_favorites
    
    def get_reorder_history_stats(self) -> dict:
        """Get statistics about user's reorder history"""
        from .job_models import ReorderJob, JobStatus
        
        stats = {
            'total_reorders': self.total_reorders,
            'successful_reorders': 0,
            'failed_reorders': 0,
            'most_used_style': None,
            'favorite_styles': self.get_favorite_styles(),
            'preferred_style': self.preferred_reorder_style,
            'style_usage': {},
            'recent_activity': []
        }
        
        # This would need to be computed in a service layer with database access
        # For now, return basic stats
        return stats
    
    def to_profile_dict(self) -> dict:
        """Convert user to profile dictionary for API responses"""
        return {
            'id': self.id,
            'spotify_username': self.spotify_username,
            'spotify_display_name': self.spotify_display_name,
            'email': self.email,
            'spotify_profile_image': self.spotify_profile_image,
            'spotify_country': self.spotify_country,
            'spotify_followers': self.spotify_followers,
            'spotify_product': self.spotify_product,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'profile_updated_at': self.profile_updated_at.isoformat() if self.profile_updated_at else None,
            'preferred_reorder_style': self.preferred_reorder_style,
            'favorite_styles': self.get_favorite_styles(),
            'user_preferences': self.get_user_preferences(),
            'total_reorders': self.total_reorders,
        }
    


class ReorderJob(Base):
    __tablename__ = "reorder_jobs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    playlist_id = Column(String, nullable=False)
    playlist_name = Column(String, nullable=True)
    
    # Job configuration
    reorder_style = Column(String, nullable=False)
    user_intent = Column(Text, nullable=True)
    personal_tone = Column(Text, nullable=True)
    reorder_method = Column(String, default="auto")
    
    # Job status
    status = Column(String, default=JobStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Progress tracking
    total_tracks = Column(Integer, default=0)
    processed_tracks = Column(Integer, default=0)
    progress_percentage = Column(Integer, default=0)
    
    # Results
    success = Column(Boolean, default=False)
    error_message = Column(Text, nullable=True)
    strategy_info = Column(Text, nullable=True)  # JSON string
    tracks_reordered = Column(Integer, default=0)
    
    # Relationship to user
    user = relationship("User", back_populates="reorder_jobs")

    @classmethod
    def cleanup_old_jobs(cls, db: Session, days_old: int = 30) -> int:
        """
        Delete jobs older than the specified number of days.
        Returns the number of jobs deleted.
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        
        # Delete jobs older than cutoff_date
        deleted_count = db.query(cls).filter(
            cls.created_at < cutoff_date
        ).delete()
        
        db.commit()
        
        if deleted_count > 0:
            print(f"Cleaned up {deleted_count} old jobs (older than {days_old} days)")
        
        return deleted_count

    @classmethod
    def cleanup_old_jobs_for_user(cls, db: Session, user_id: str, days_old: int = 30) -> int:
        """
        Delete jobs older than the specified number of days for a specific user.
        Returns the number of jobs deleted.
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        
        deleted_count = db.query(cls).filter(
            cls.user_id == user_id,
            cls.created_at < cutoff_date
        ).delete()
        
        db.commit()
        
        return deleted_count

    @classmethod
    def get_job_stats(cls, db: Session) -> dict:
        """Get statistics about jobs in the database"""
        total_jobs = db.query(cls).count()
        old_jobs = db.query(cls).filter(
            cls.created_at < datetime.utcnow() - timedelta(days=30)
        ).count()
        
        status_counts = {}
        for status in JobStatus:
            status_counts[status.value] = db.query(cls).filter(
                cls.status == status.value
            ).count()
        
        return {
            "total_jobs": total_jobs,
            "old_jobs": old_jobs,
            "status_counts": status_counts
        }


class Session(Base):
    __tablename__ = 'sessions'
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey('users.id'))
    user = relationship("User")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./spotify.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    Base.metadata.create_all(bind=engine)
