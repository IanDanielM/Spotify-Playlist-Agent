from typing import Optional
from uuid import uuid4

import fastapi
import httpx
from fastapi import Request

from spotifyops.config.config import Config

router = fastapi.APIRouter()

@router.get('/spotify/login')
async def login():
    state = str(uuid4())
    params = {
        'client_id': Config.CLIENT_ID,
        'response_type': 'code',
        'redirect_uri': Config.CALLBACK_URL,
        'state': state,
        'scope': Config.SCOPE
    }
    print(Config.AUTH_URL, params)
    async with httpx.AsyncClient() as client:
        response = await client.get(Config.AUTH_URL, params=params)
    return {"auth_url": str(response.url)}


@router.get('/callback')
async def callback(request: Request, code: Optional[str] = None):
    if code is None:
        return {"error": "Authorization code not provided."}

    payload = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': Config.CALLBACK_URL,
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(
            Config.TOKEN_URL,
            data=payload,
            headers=Config.get_headers()
        )
    res = response.json()

    # Save the access token and refresh token for later use
    access_token = res.get('access_token')
    new_refresh_token = res.get('refresh_token')

    with open('spotify_tokens.json', 'w') as f:
        f.write(f'{{"access_token": "{access_token}", "refresh_token": "{new_refresh_token}"}}')

    return {"access_token": access_token, "refresh_token": new_refresh_token}