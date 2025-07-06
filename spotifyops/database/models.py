from sqlalchemy import create_engine, Column, String, LargeBinary, ForeignKey
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.ext.declarative import declarative_base
from cryptography.fernet import Fernet
import os

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

class User(Base):
    __tablename__ = 'users'
    id = Column(String, primary_key=True)
    encrypted_access_token = Column(LargeBinary)
    encrypted_refresh_token = Column(LargeBinary)

    def set_tokens(self, access_token, refresh_token):
        self.encrypted_access_token = cipher_suite.encrypt(access_token.encode())
        self.encrypted_refresh_token = cipher_suite.encrypt(refresh_token.encode())

    def get_tokens(self):
        try:
            access_token = cipher_suite.decrypt(self.encrypted_access_token).decode()
            refresh_token = cipher_suite.decrypt(self.encrypted_refresh_token).decode()
            return access_token, refresh_token
        except Exception as e:
            # Tokens were encrypted with a different key - force re-authentication
            print(f"Token decryption failed: {e}")
            raise ValueError("Invalid tokens - re-authentication required")

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
