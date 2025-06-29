import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import { Music, Sparkles, ArrowRight, Play, Users, Zap, Headphones, Brain, Shuffle } from 'lucide-react'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const response = await fetch('/api/me', { credentials: 'include' });
        if (response.ok) {
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };
    checkUserStatus();
  }, []);

  const handleSpotifyLogin = async () => {
    try {
      const response = await fetch('/api/spotify/login', { credentials: 'include' })
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
      <div className="w-full min-h-screen bg-gradient-to-br from-spotify-dark via-gray-900 to-black text-white overflow-x-hidden">
        <Routes>
          <Route
            path="/"
            element={
              isConnected ? (
                <Dashboard />
              ) : (
                <HomePage onSpotifyLogin={handleSpotifyLogin} />
              )
            }
          />
          <Route path="/callback" element={<CallbackPage />} />
        </Routes>
      </div>
    </Router>
  )
}

function HomePage({ onSpotifyLogin }: { onSpotifyLogin: () => void }) {
  return (
    <div className="relative w-full">
      {/* Animated Background Particles */}
      <ParticleBackground />
      
      {/* Navigation */}
      <nav className="relative z-10 w-full px-6 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-spotify-green/20 border border-spotify-green/30">
              <Music className="h-8 w-8 text-spotify-green" />
            </div>
            <span className="text-2xl font-bold gradient-text">Playlist Reorder</span>
          </div>
          <button
            onClick={onSpotifyLogin}
            className="px-6 py-3 bg-spotify-green hover:bg-spotify-light rounded-full font-semibold transition-all duration-300 hover:scale-105 pulse-glow"
          >
            Connect Spotify
          </button>
        </div>
      </nav>

      {/* Hero Section - Full Screen */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-12 float-animation">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-spotify-green/30 blur-3xl rounded-full scale-150"></div>
              <div className="relative bg-gradient-to-br from-spotify-green/20 to-spotify-light/20 p-12 rounded-full border-2 border-spotify-green/30 glass">
                <Music className="h-24 w-24 text-spotify-green mx-auto" />
              </div>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight mb-8 gradient-text">
            AI-Powered
            <br />
            <span className="text-white">Playlist Magic</span>
          </h1>
          
          <p className="text-xl md:text-2xl leading-relaxed text-gray-300 max-w-4xl mx-auto mb-12">
            Transform your Spotify playlists with cutting-edge AI that understands music like never before. 
            Create perfect emotional journeys, energy flows, and narrative arcs that will revolutionize 
            how you experience music.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
            <button
              onClick={onSpotifyLogin}
              className="group relative overflow-hidden bg-gradient-to-r from-spotify-green to-spotify-light px-12 py-6 text-xl font-bold text-white shadow-2xl hover:shadow-spotify-green/25 transition-all duration-300 rounded-full flex items-center gap-4 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-spotify-light to-spotify-green opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center gap-4">
                <Play className="h-6 w-6" />
                Start Your Journey
                <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
              </span>
            </button>
            
            <button className="px-8 py-6 text-xl font-semibold text-white border-2 border-white/20 rounded-full hover:border-spotify-green/50 hover:bg-spotify-green/10 transition-all duration-300 flex items-center gap-3">
              <Headphones className="h-6 w-6" />
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <StatCard number="10M+" label="Songs Analyzed" />
            <StatCard number="500K+" label="Playlists Transformed" />
            <StatCard number="99.9%" label="User Satisfaction" />
          </div>
        </div>
      </section>

      {/* Features Section - Full Width */}
      <section className="relative w-full py-32 bg-gradient-to-b from-transparent to-gray-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
              Revolutionary AI Technology
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Our advanced neural networks analyze every aspect of your music to create the perfect listening experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Brain className="h-12 w-12 text-spotify-green" />}
              title="Deep Learning Analysis"
              description="Advanced AI analyzes lyrics, tempo, key, mood, and emotional content to understand each song's essence."
              gradient="from-purple-500/20 to-spotify-green/20"
            />
            <FeatureCard
              icon={<Zap className="h-12 w-12 text-yellow-400" />}
              title="Energy Flow Optimization"
              description="Creates perfect energy transitions for workouts, parties, or relaxation with scientific precision."
              gradient="from-yellow-500/20 to-orange-500/20"
            />
            <FeatureCard
              icon={<Sparkles className="h-12 w-12 text-pink-400" />}
              title="Emotional Journey Crafting"
              description="Builds compelling emotional narratives that take listeners on unforgettable musical adventures."
              gradient="from-pink-500/20 to-purple-500/20"
            />
          </div>
        </div>
      </section>

      {/* How It Works - Full Width */}
      <section className="relative w-full py-32 bg-gradient-to-b from-gray-900/50 to-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-white">
              How The Magic Happens
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Four simple steps to transform your playlists forever
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <ProcessStep 
              number="01" 
              title="Connect & Authenticate" 
              description="Securely link your Spotify account with enterprise-grade encryption"
              icon={<Play className="h-8 w-8" />}
            />
            <ProcessStep 
              number="02" 
              title="Select Your Playlist" 
              description="Choose any playlist you want to transform with AI magic"
              icon={<Music className="h-8 w-8" />}
            />
            <ProcessStep 
              number="03" 
              title="AI Deep Analysis" 
              description="Our neural networks analyze every song's DNA in seconds"
              icon={<Brain className="h-8 w-8" />}
            />
            <ProcessStep 
              number="04" 
              title="Perfect Reordering" 
              description="Experience your music like never before with optimal flow"
              icon={<Shuffle className="h-8 w-8" />}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative w-full py-32">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-5xl md:text-6xl font-bold mb-8 gradient-text">
            Ready to Transform Your Music?
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Join thousands of music lovers who have already discovered the power of AI-curated playlists
          </p>
          <button
            onClick={onSpotifyLogin}
            className="group relative overflow-hidden bg-gradient-to-r from-spotify-green to-spotify-light px-16 py-8 text-2xl font-bold text-white shadow-2xl hover:shadow-spotify-green/25 transition-all duration-300 rounded-full hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-spotify-light to-spotify-green opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative flex items-center gap-4">
              <Play className="h-8 w-8" />
              Get Started Now
              <ArrowRight className="h-8 w-8 group-hover:translate-x-2 transition-transform duration-300" />
            </span>
          </button>
        </div>
      </section>
    </div>
  )
}

function CallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // The backend handles the redirect, so we just need to wait for it.
    // If the page is displayed, it means the redirect is in progress.
    // We can optionally add a timeout to handle errors.
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000); // 5-second timeout to prevent getting stuck

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-8">
          <div className="animate-spin rounded-full h-24 w-24 border-4 border-spotify-green/20 border-t-spotify-green mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Music className="h-8 w-8 text-spotify-green animate-pulse" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Connecting to Spotify...</h2>
        <p className="text-gray-400 text-lg">Setting up your AI-powered music experience</p>
      </div>
    </div>
  );
}

function ParticleBackground() {
  const [particles, setParticles] = useState<Array<{id: number, left: number, delay: number}>>([])

  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 8
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="particles">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: `${particle.left}%`,
            animationDelay: `${particle.delay}s`
          }}
        />
      ))}
    </div>
  )
}

function StatCard({ number, label }: { number: string, label: string }) {
  return (
    <div className="text-center p-6 rounded-2xl glass hover-lift">
      <div className="text-4xl md:text-5xl font-black text-spotify-green mb-2">{number}</div>
      <div className="text-gray-300 font-semibold">{label}</div>
    </div>
  )
}

function FeatureCard({ icon, title, description, gradient }: { 
  icon: React.ReactNode, 
  title: string, 
  description: string,
  gradient: string 
}) {
  return (
    <div className="group relative hover-lift">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
      <div className="relative p-8 rounded-3xl border border-gray-800 glass backdrop-blur-xl hover:border-spotify-green/30 transition-all duration-500">
        <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-spotify-green/20 to-spotify-light/20 border border-spotify-green/30 mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="text-2xl font-bold text-white mb-4 text-center">{title}</h3>
        <p className="text-gray-300 leading-relaxed text-center">{description}</p>
      </div>
    </div>
  )
}

function ProcessStep({ number, title, description, icon }: { 
  number: string, 
  title: string, 
  description: string,
  icon: React.ReactNode 
}) {
  return (
    <div className="text-center group hover-lift">
      <div className="relative mb-6">
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-spotify-green/20 to-spotify-light/20 border-2 border-spotify-green/30 flex items-center justify-center glass group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-spotify-green rounded-full flex items-center justify-center text-sm font-bold text-black">
          {number}
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  )
}

export default App