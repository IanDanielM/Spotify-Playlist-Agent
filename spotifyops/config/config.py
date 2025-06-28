import base64
from os import getenv

from dotenv import load_dotenv

load_dotenv()


class Config:
    BASE_URL = "https://api.spotify.com"
    AUTH_URL = "https://accounts.spotify.com/authorize"
    TOKEN_URL = "https://accounts.spotify.com/api/token"
    CLIENT_ID = getenv('SPOTIFY_CLIENT_ID')
    CALLBACK_URL = "http://127.0.0.1:8000/callback"
    CLIENT_SECRET = getenv('SPOTIFY_CLIENT_SECRET')
    GENIUS_ACCESS_TOKEN = getenv('GENIUS_CLIENT_ACCESS_TOKEN')
    SCOPE = getenv('SPOTIFY_SCOPE')
    url = "https://accounts.spotify.com/authorize"
    refresh_token = getenv('SPOTIFY_REFRESH_TOKEN')
    client_id_and_secret = getenv('SPOTIFY_CLIENT_ID') + ":" + getenv('SPOTIFY_CLIENT_SECRET')
    b64_client = base64.b64encode(client_id_and_secret.encode()).decode()
    
    @staticmethod   
    def spotify_credentials():
        with open('spotify_tokens.json', 'r') as f:
            tokens = f.read()
        tokens = eval(tokens)
        return tokens.get('access_token'), tokens.get('refresh_token')

    @staticmethod
    def get_headers():
        return {
            'Authorization': f'Basic {Config.b64_client}',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
