from sqlalchemy import create_engine, Column, String, LargeBinary, ForeignKey
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.ext.declarative import declarative_base
from cryptography.fernet import Fernet
import os

# Generate a key for encryption. In a real application, you'd want to load
# this from a secure location (e.g., environment variables).
ENCRYPTION_KEY = os.environ.get("ENCRYPTION_KEY", Fernet.generate_key().decode())
cipher_suite = Fernet(ENCRYPTION_KEY.encode())

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(String, primary_key=True)
    encrypted_access_token = Column(LargeBinary)
    encrypted_refresh_token = Column(LargeBinary)

    def set_tokens(self, access_token, refresh_token):
        self.encrypted_access_token = cipher_suite.encrypt(access_token.encode())
        self.encrypted_refresh_token = cipher_suite.encrypt(refresh_token.encode())

    def get_tokens(self):
        access_token = cipher_suite.decrypt(self.encrypted_access_token).decode()
        refresh_token = cipher_suite.decrypt(self.encrypted_refresh_token).decode()
        return access_token, refresh_token

class Session(Base):
    __tablename__ = 'sessions'
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey('users.id'))
    user = relationship("User")

DATABASE_URL = "sqlite:///./spotify.db"
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
