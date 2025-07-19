# AI Spotify Narrative Agent 🎵

Transform your Spotify playlists into perfectly flowing musical experiences using advanced AI agents that understand music, emotions, and storytelling. This  system analyzes lyrics, mood, energy, and musical elements to create seamless narrative arcs in your playlists.

## ✨ Key Features

### 🤖 **Intelligent AI Analysis**
- **Multi-Agent Architecture**: Sophisticated ReAct agents with memory persistence
- **Lyrical Analysis**: Deep understanding of song meanings using Genius API integration
- **Musical Context**: Analysis of energy, mood, and emotional tone
- **Vector Memory**: ChromaDB-powered caching for efficient re-analysis

### 🎭 **Advanced Reordering Styles**
- **Emotional Journey**: Creates crescendos from melancholy → uplifting → resolution
- **Energy Flow**: Perfect workout progressions (chill → hype → cooldown)
- **Narrative Arc**: Complete storytelling through music with clear chapters
- **Vibe Matching**: Groups similar moods while maintaining smooth transitions

### ⚡ **Smart Processing Options**
- **Synchronous Mode**: Real-time processing with live progress tracking
- **Asynchronous Mode**: Background processing for large playlists (50+ tracks)
- **Intelligent Strategy**: Minimal API calls using move optimization algorithms
- **Preview Mode**: See changes before applying to your actual playlist

### 🎯 **User Experience**
- **Interactive Tutorial**: Guided onboarding for new users
- **Manual Reordering**: Drag-and-drop interface for fine-tuning
- **Real-time Preview**: Compare before/after with visual indicators
- **Job History**: Track all your reordering sessions with detailed analytics

### 🔧 **Technical Excellence**
- **Hierarchical Processing**: Handles playlists of any size without losing tracks
- **Database Persistence**: SQLite with Alembic migrations for data integrity
- **OAuth Integration**: Secure Spotify authentication with token refresh
- **Error Recovery**: Robust error handling and fallback mechanisms

## 🏗️ Architecture Overview

```
├── frontend/                    # React TypeScript SPA
│   ├── src/components/         # React components
│   │   ├── Dashboard.tsx       # Main application flow
│   │   ├── PlaylistSelection.tsx # Spotify playlist browser
│   │   ├── InteractiveTutorial.tsx # User onboarding
│   │   ├── RealTimePlaylistReorder.tsx # Manual drag-drop
│   │   └── ...                 # 20+ specialized components
│   ├── package.json           # Frontend dependencies
│   └── vite.config.ts         # Build configuration
│
├── spotifyops/                 # Python backend
│   ├── agent/                  # AI agent system
│   │   └── playlist_agent.py   # ReAct agent with tools
│   ├── api/                    # FastAPI routes
│   │   ├── auth.py            # Spotify OAuth
│   │   ├── reorder.py         # Core reordering endpoints
│   │   └── profile.py         # User management
│   ├── logic/                  # Core algorithms
│   │   ├── hierarchical_reorder.py # Multi-agent processing
│   │   ├── intelligent_reorder.py  # Move optimization
│   │   ├── reorder_logic.py    # Sequencing algorithms
│   │   └── embedding_store.py  # Vector memory system
│   ├── background/             # Async processing
│   │   └── job_processor.py    # Background task handler
│   ├── database/               # Data persistence
│   │   └── models.py          # SQLAlchemy models
│   ├── tools/                  # External integrations
│   │   ├── spotify.py         # Spotify Web API client
│   │   ├── genius.py          # Lyrics fetching
│   │   └── browser_tool.py    # Web research tool
│   └── config/                # Configuration management
│
├── alembic/                   # Database migrations
├── tests/                     # Test suite
├── main.py                   # FastAPI application entry
└── requirements.txt          # Python dependencies
```

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+** with pip
- **Node.js 18+** with npm
- **Spotify Developer Account** (free)
- **API Keys**: OpenAI/DeepSeek, Genius, VoyageAI(For embeddings)

### 1. Clone & Setup Environment

```bash
git clone <repository-url>
cd myspotifyagent

# Create Python virtual environment (recommended)
python -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create `.env` file in the root directory:

```bash
cp .env.example .env
```
replace the placeholders with your actual API keys and Spotify credentials.

### 3. Initialize Database

change the uri in alembic.ini to point to your SQLite database or PostgreSQL if preferred.

```bash
# Run database migrations
alembic upgrade head
```

### 4. Start Backend Server

```bash
fastapi dev main.py
```

### 5. Start Frontend Development Server

```bash
cd frontend
npm install
npm run dev
```

### 6. Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🎵 How It Works

### 1. **Authentication Flow**
```
User → Frontend → Spotify OAuth → Backend → Encrypted Token Storage
```

### 2. **AI Analysis Pipeline**
```
Playlist → Track Extraction → Multi-Agent Analysis → Vector Storage → Sequencing
```

### 3. **Reordering Strategies**

#### **Hierarchical Agent Approach** (Large Playlists)
1. **Categorization Agent**: Groups songs into narrative phases
2. **Ordering Agent**: Sequences within each category
3. **Assembly Agent**: Creates final optimal flow

#### **Single-LLM Approach** (Small Playlists)
- Direct sequencing with style-specific prompts
- Optimized for speed and simplicity

#### **Intelligent Move Calculation**
- Analyzes similarity between original and target order
- Chooses between minimal API moves vs. full rewrite
- Optimizes Spotify API rate limits

### 4. **Processing Modes**

| Mode | Best For | Processing | User Experience |
|------|----------|------------|-----------------|
| **Sync** | Small playlists (<20 tracks) | Real-time | Immediate results |
| **Async** | Large playlists (20+ tracks) | Background | Progress tracking |

## 🎯 Usage Examples

### Workout Playlist
```
Style: Energy Flow
Intent: "Create the perfect gym session"
Tone: "High energy, motivational"
Result: Warm-up → Intense → Peak → Cooldown
```

### Date Night Playlist
```
Style: Emotional Journey
Intent: "Romantic dinner for two"
Tone: "Intimate, sophisticated"
Result: Mellow start → Building romance → Memorable peaks
```

### Study Session
```
Style: Vibe Matching
Intent: "Deep focus and concentration"
Tone: "Calm, consistent energy"
Result: Grouped ambient sections with minimal disruption
```

## 🛠️ Technology Stack

### **Frontend**
- **React 18** with TypeScript for type safety
- **Vite** for lightning-fast development
- **Tailwind CSS** for consistent styling
- **Lucide React** for beautiful icons
- **React Router** for navigation

### **Backend**
- **FastAPI** for high-performance async API
- **LangChain** for AI agent orchestration
- **SQLAlchemy** for database ORM
- **Alembic** for database migrations
- **ChromaDB** for vector embeddings
- **SQLite** for data persistence

### **AI & ML**
- **DeepSeek/OpenAI** for language models
- **VoyageAI** for text embeddings
- **Vector Search** for musical similarity

### **External APIs**
- **Spotify Web API** for playlist management
- **Genius API** for lyrics and song metadata
- **OAuth 2.0** for secure authentication



## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Spotify** for their comprehensive Web API
- **OpenAI/DeepSeek** for language model capabilities
- **LangChain** for agent framework
- **Genius** for lyrics database access
- **React & FastAPI** communities for excellent documentation
- **GitHub Copilot** for agentic code execution(couldn't have done without it especially for the frontend)


**Made with ❤️ for music lovers who believe playlists should tell stories**
