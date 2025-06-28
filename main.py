from spotifyops.api.auth import router
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Welcome to the Spotify Ops API"}    

# Include the auth router
app.include_router(router, tags=["auth"])




