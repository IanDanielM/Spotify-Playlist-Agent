from spotifyops.api.auth import router as auth_router
from spotifyops.api.reorder import router as reorder_router
from spotifyops.api.profile import router as profile_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to the Spotify Ops API"}

# Include the routers
app.include_router(auth_router, prefix="/api", tags=["auth"])
app.include_router(reorder_router, prefix="/api", tags=["reorder"])
app.include_router(profile_router, prefix="/api", tags=["profile"])




