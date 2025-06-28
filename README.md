# Spotify Playlist Reorder

AI-powered Spotify playlist organization tool that transforms your playlists with intelligent reordering based on emotional journeys, energy flows, and narrative arcs.

## Features

- 🎵 **AI-Powered Analysis**: Advanced AI analyzes lyrics, mood, and musical elements
- ⚡ **Smart Reordering**: Multiple reordering styles (emotional journeys, energy flows, narrative arcs)
- 🎯 **Perfect Flow**: Creates seamless transitions that enhance listening experience
- 🔗 **Spotify Integration**: Direct integration with Spotify API for playlist management

## Project Structure

```
├── frontend/           # React/TypeScript frontend application
│   ├── src/           # React components and TypeScript files
│   ├── package.json   # Frontend dependencies
│   └── vite.config.ts # Vite configuration
├── spotifyops/        # Python backend with AI agents
│   ├── agent/         # AI agents for playlist analysis
│   ├── api/           # FastAPI routes
│   ├── config/        # Configuration management
│   ├── logic/         # Core business logic
│   └── tools/         # Spotify and external API tools
├── main.py            # FastAPI backend entry point
├── requirements.txt   # Python dependencies
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Spotify Developer Account

### Environment Variables

Create a `.env` file in the root directory:

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_SCOPE=playlist-read-private playlist-modify-private playlist-modify-public
SPOTIFY_REFRESH_TOKEN=your_refresh_token
GENIUS_CLIENT_ACCESS_TOKEN=your_genius_token
OPENAI_API_KEY=your_openai_api_key
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Development

```bash
# Install Python dependencies
python -m pip install -r requirements.txt

# Start the FastAPI server
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

The backend API will be available at `http://localhost:8000`

## Usage

1. **Connect Spotify**: Click "Connect Spotify" to authenticate with your Spotify account
2. **Select Playlist**: Choose a playlist you want to reorder
3. **Choose Style**: Select your preferred reordering style:
   - **Emotional Journey**: Creates emotional crescendos from melancholy to uplifting
   - **Energy Flow**: Perfect for workouts with chill → hype → cool down progression
   - **Narrative Arc**: Tells a complete story through your music
   - **Vibe Matching**: Groups similar moods and energies together
4. **AI Analysis**: The AI analyzes lyrics, mood, and musical elements
5. **Preview & Apply**: Review the new order and apply changes to your Spotify playlist

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- Lucide React for icons

### Backend
- FastAPI for API framework
- LangChain for AI agent orchestration
- OpenAI GPT-4 for music analysis
- ChromaDB for vector storage
- Spotify Web API for playlist management
- Genius API for lyrics fetching

## API Endpoints

- `GET /spotify/login` - Initiate Spotify OAuth flow
- `GET /callback` - Handle Spotify OAuth callback
- `POST /api/reorder-playlist` - Analyze and reorder playlist

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Spotify Web API for playlist management
- OpenAI for AI-powered music analysis
- Genius for lyrics data
- The music community for inspiration