import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import { Music, ArrowRight, Play, Brain, Shuffle } from 'lucide-react'
import Dashboard from './components/Dashboard'
import UserSettings from './components/UserSettings'
import SharedPlaylist from './components/SharedPlaylist'
import './App.css'

function App() {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const checkUserStatus = async () => {
    try {
      console.log('Checking user status...');
      console.log('Document cookies:', document.cookie);
      
      const response = await fetch('/api/me', { credentials: 'include' });
      console.log('Auth check response:', response.status, response.ok);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('User authenticated:', userData);
        if (userData && userData.user_id) {
          setIsConnected(true);
        } else {
          console.log('No user data in response');
          setIsConnected(false);
        }
      } else {
        console.log('User not authenticated, status:', response.status);
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error checking user status:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkUserStatus();
  }, []);

  // Listen for navigation changes to re-check auth status
  useEffect(() => {
    const handleFocus = () => {
      checkUserStatus();
    };
    
    // Listen for successful authentication
    const handleAuthSuccess = () => {
      console.log('Authentication success event received');
      checkUserStatus();
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('auth-success', handleAuthSuccess);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('auth-success', handleAuthSuccess);
    };
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

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-spotify-dark via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-spotify-green/20 border-t-spotify-green mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
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
          <Route path="/settings" element={<UserSettings />} />
          <Route path="/shared-playlist/:playlistId" element={<SharedPlaylist />} />
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
          <div className="flex items-center gap-4">
            <button
              onClick={onSpotifyLogin}
              className="px-6 py-3 bg-spotify-green hover:bg-spotify-light rounded-full font-semibold transition-all duration-300 hover:scale-105 pulse-glow"
            >
              Connect Spotify
            </button>
          </div>
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
                Connect to Spotify
                <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
              </span>
            </button>
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
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get session token from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const sessionToken = urlParams.get('session_token');
        
        console.log('Callback page loaded with session_token:', sessionToken);
        
        if (!sessionToken) {
          console.error('No session token found in URL');
          setStatus('error');
          setTimeout(() => navigate('/'), 3000);
          return;
        }
        
        // Exchange session token for cookie
        console.log('Exchanging session token for cookie...');
        const response = await fetch('/api/set-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ session_token: sessionToken })
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Session set successfully:', data);
          setStatus('success');
          
          // Clear the URL parameters
          window.history.replaceState({}, '', '/callback');
          
          // Dispatch auth success event
          window.dispatchEvent(new CustomEvent('auth-success'));
          
          setTimeout(() => navigate('/'), 1000);
        } else {
          console.error('Failed to set session:', response.status);
          setStatus('error');
          setTimeout(() => navigate('/'), 3000);
        }
        
      } catch (error) {
        console.error('Error in callback handling:', error);
        setStatus('error');
        setTimeout(() => navigate('/'), 3000);
      }
    };
    
    handleCallback();
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
        {status === 'processing' && (
          <>
            <h2 className="text-3xl font-bold text-white mb-4">Connecting to Spotify...</h2>
            <p className="text-gray-400 text-lg">Setting up your AI-powered music experience</p>
          </>
        )}
        {status === 'success' && (
          <>
            <h2 className="text-3xl font-bold text-green-400 mb-4">Connected Successfully!</h2>
            <p className="text-gray-400 text-lg">Redirecting to your dashboard...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h2 className="text-3xl font-bold text-red-400 mb-4">Connection Failed</h2>
            <p className="text-gray-400 text-lg">Redirecting back to login...</p>
          </>
        )}
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