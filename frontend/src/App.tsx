import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Music, Sparkles, ArrowRight, Play, Users, Zap } from 'lucide-react'
import './App.css'

function App() {
  const [isConnected, setIsConnected] = useState(false)

  const handleSpotifyLogin = async () => {
    try {
      const response = await fetch('/api/spotify/login')
      const data = await response.json()
      if (data.auth_url) {
        window.location.href = data.auth_url
      }
    } catch (error) {
      console.error('Error initiating Spotify login:', error)
    }
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-spotify-dark via-gray-900 to-black text-white">
        <Routes>
          <Route path="/" element={<HomePage onSpotifyLogin={handleSpotifyLogin} isConnected={isConnected} />} />
          <Route path="/callback" element={<CallbackPage setIsConnected={setIsConnected} />} />
        </Routes>
      </div>
    </Router>
  )
}

function HomePage({ onSpotifyLogin, isConnected }: { onSpotifyLogin: () => void, isConnected: boolean }) {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <div className="relative px-6 lg:px-8">
        <div className="mx-auto max-w-7xl pt-20 pb-32 sm:pt-32 sm:pb-40">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-spotify-green/20 blur-3xl rounded-full"></div>
                <div className="relative bg-spotify-green/10 p-6 rounded-full border border-spotify-green/20">
                  <Music className="h-16 w-16 text-spotify-green" />
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl font-bold tracking-tight sm:text-7xl bg-gradient-to-r from-white via-spotify-light to-spotify-green bg-clip-text text-transparent">
              Playlist Reorder
            </h1>
            
            <p className="mt-6 text-xl leading-8 text-gray-300 max-w-3xl mx-auto">
              Transform your Spotify playlists with AI-powered reordering. Create perfect emotional journeys, 
              energy flows, and narrative arcs that enhance your listening experience.
            </p>
            
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button
                onClick={onSpotifyLogin}
                className="group relative overflow-hidden bg-spotify-green px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-spotify-light transition-all duration-300 rounded-full flex items-center gap-3"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-spotify-green to-spotify-light opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center gap-3">
                  <Play className="h-5 w-5" />
                  Connect Spotify
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              AI-Powered Music Intelligence
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Our advanced AI analyzes lyrics, mood, and musical elements to create the perfect listening experience.
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <FeatureCard
                icon={<Sparkles className="h-8 w-8 text-spotify-green" />}
                title="Emotional Journeys"
                description="Creates emotional crescendos from melancholy to uplifting, crafting perfect mood transitions."
              />
              <FeatureCard
                icon={<Zap className="h-8 w-8 text-spotify-green" />}
                title="Energy Flow"
                description="Perfect for workouts with chill → hype → cool down progression that matches your activity."
              />
              <FeatureCard
                icon={<Users className="h-8 w-8 text-spotify-green" />}
                title="Narrative Arc"
                description="Tells a complete story through your music, creating compelling listening narratives."
              />
            </dl>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-24 sm:py-32 bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              How It Works
            </h2>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
              <StepCard number="1" title="Connect" description="Link your Spotify account securely" />
              <StepCard number="2" title="Select" description="Choose the playlist to reorder" />
              <StepCard number="3" title="Analyze" description="AI analyzes lyrics and musical elements" />
              <StepCard number="4" title="Transform" description="Apply the perfect new order" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CallbackPage({ setIsConnected }: { setIsConnected: (connected: boolean) => void }) {
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    
    if (code) {
      fetch(`/api/callback?code=${code}`)
        .then(response => response.json())
        .then(data => {
          if (data.access_token) {
            setIsConnected(true)
            // Redirect to main app or dashboard
            window.location.href = '/'
          }
        })
        .catch(error => {
          console.error('Error handling callback:', error)
        })
    }
  }, [setIsConnected])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-spotify-green mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold text-white">Connecting to Spotify...</h2>
        <p className="text-gray-400 mt-2">Please wait while we set up your account.</p>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-spotify-green/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative p-8 rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm hover:border-spotify-green/30 transition-colors duration-300">
        <dt className="flex items-center gap-x-3 text-xl font-semibold leading-7 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-spotify-green/10 border border-spotify-green/20">
            {icon}
          </div>
          {title}
        </dt>
        <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
          <p className="flex-auto">{description}</p>
        </dd>
      </div>
    </div>
  )
}

function StepCard({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-spotify-green/10 border-2 border-spotify-green/20 text-2xl font-bold text-spotify-green mb-4">
        {number}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  )
}

export default App