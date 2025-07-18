import React, { useState, useEffect } from 'react';
import { 
  Music, 
  Sparkles, 
  Brain, 
  Zap, 
  CheckCircle, 
  ArrowRight, 
  Star,
  Users,
  Headphones,
  Play,
  X
} from 'lucide-react';

interface OnboardingProps {
  isVisible: boolean;
  onComplete: () => void;
  onStartTutorial: () => void;
  userProfile?: {
    display_name: string;
    images?: Array<{ url: string }>;
  };
}

const UserOnboarding: React.FC<OnboardingProps> = ({
  isVisible,
  onComplete,
  onStartTutorial,
  userProfile
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState({
    experience_level: '',
    primary_use_case: '',
    music_genres: [] as string[],
    playlist_size_preference: '',
    notifications: true
  });

  const steps = [
    'welcome',
    'experience',
    'use_case',
    'preferences',
    'features',
    'completion'
  ];

  useEffect(() => {
    // Save preferences to localStorage when they change
    localStorage.setItem('user_onboarding_preferences', JSON.stringify(preferences));
  }, [preferences]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Mark onboarding as complete on backend
      await fetch('/api/me/onboarding-state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ completed: true })
      });
      
      // Also save preferences if we have any
      if (Object.values(preferences).some(val => val !== '' && val !== null && (Array.isArray(val) ? val.length > 0 : true))) {
        await fetch('/api/me/preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ preferences })
        });
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
    
    onComplete();
  };

  const handleSkip = async () => {
    try {
      // Mark onboarding as complete even if skipped
      await fetch('/api/me/onboarding-state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ completed: true })
      });
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
    
    onComplete();
  };

  const updatePreference = (key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleGenre = (genre: string) => {
    setPreferences(prev => ({
      ...prev,
      music_genres: prev.music_genres.includes(genre)
        ? prev.music_genres.filter(g => g !== genre)
        : [...prev.music_genres, genre]
    }));
  };

  if (!isVisible) return null;

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
        
        {/* Progress Bar */}          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Welcome to AI Playlist Reordering</h2>
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-white transition-colors"
                title="Skip onboarding"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-white/10 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-purple-200 text-sm">
                Step {currentStep + 1} of {steps.length}
              </p>
              <button
                onClick={handleSkip}
                className="text-sm text-gray-400 hover:text-purple-300 transition-colors"
              >
                Skip Setup
              </button>
            </div>
          </div>

        {/* Step Content */}
        <div className="p-8">
          {/* Welcome Step */}
          {currentStep === 0 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">
                {userProfile?.display_name ? `Hey ${userProfile.display_name}!` : 'Welcome!'}
              </h3>
              <p className="text-purple-200 text-lg mb-8 max-w-2xl mx-auto">
                Get ready to transform your Spotify playlists with AI. We'll create perfect listening experiences 
                tailored to your mood, activity, and musical taste.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/10 rounded-2xl p-6">
                  <Brain className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <h4 className="text-white font-semibold mb-2">AI-Powered</h4>
                  <p className="text-purple-200 text-sm">
                    Advanced algorithms analyze your music to create perfect flows
                  </p>
                </div>
                <div className="bg-white/10 rounded-2xl p-6">
                  <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <h4 className="text-white font-semibold mb-2">Lightning Fast</h4>
                  <p className="text-purple-200 text-sm">
                    Reorder playlists in seconds with intelligent processing
                  </p>
                </div>
                <div className="bg-white/10 rounded-2xl p-6">
                  <Music className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h4 className="text-white font-semibold mb-2">Your Style</h4>
                  <p className="text-purple-200 text-sm">
                    Completely personalized to your preferences and goals
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Experience Level Step */}
          {currentStep === 1 && (
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">How familiar are you with playlist curation?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    id: 'beginner',
                    title: 'New to This',
                    description: 'I usually just hit shuffle and go',
                    icon: <Star className="w-6 h-6" />
                  },
                  {
                    id: 'intermediate',
                    title: 'Some Experience',
                    description: 'I organize my music but want better results',
                    icon: <Users className="w-6 h-6" />
                  },
                  {
                    id: 'advanced',
                    title: 'Playlist Pro',
                    description: 'I love crafting the perfect listening experience',
                    icon: <Headphones className="w-6 h-6" />
                  }
                ].map((level) => (
                  <button
                    key={level.id}
                    onClick={() => updatePreference('experience_level', level.id)}
                    className={`p-6 rounded-2xl border-2 transition-all text-left ${
                      preferences.experience_level === level.id
                        ? 'border-purple-400 bg-purple-500/20'
                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-purple-400 mb-3">{level.icon}</div>
                    <h4 className="text-white font-semibold mb-2">{level.title}</h4>
                    <p className="text-purple-200 text-sm">{level.description}</p>
                  </button>
                ))}
              </div>
              
              {preferences.experience_level && (
                <div className="mt-6 p-3 bg-green-500/20 border border-green-400/30 rounded-lg">
                  <p className="text-green-200 text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Perfect! We'll tailor the experience for your level.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Use Case Step */}
          {currentStep === 2 && (
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">What do you mainly use playlists for?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'workout', title: 'Working Out', description: 'High energy, motivation, pump-up music' },
                  { id: 'focus', title: 'Focus & Study', description: 'Concentration, background music, flow state' },
                  { id: 'party', title: 'Parties & Social', description: 'Crowd-pleasers, dancing, entertaining' },
                  { id: 'relaxation', title: 'Relaxation', description: 'Chill vibes, unwinding, background ambiance' },
                  { id: 'commute', title: 'Commuting', description: 'Travel music, driving, daily routines' },
                  { id: 'discovery', title: 'Music Discovery', description: 'Exploring new artists, expanding taste' }
                ].map((useCase) => (
                  <button
                    key={useCase.id}
                    onClick={() => updatePreference('primary_use_case', useCase.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      preferences.primary_use_case === useCase.id
                        ? 'border-purple-400 bg-purple-500/20'
                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <h4 className="text-white font-semibold mb-1">{useCase.title}</h4>
                    <p className="text-purple-200 text-sm">{useCase.description}</p>
                  </button>
                ))}
              </div>
              
              {preferences.primary_use_case && (
                <div className="mt-6 p-3 bg-green-500/20 border border-green-400/30 rounded-lg">
                  <p className="text-green-200 text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Great choice! We'll optimize for {preferences.primary_use_case.replace('_', ' ')} scenarios.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Music Preferences Step */}
          {currentStep === 3 && (
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">What genres do you love?</h3>
              <p className="text-purple-200 mb-6">Select at least 2-3 genres to help us understand your taste:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  'Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Jazz', 'Classical', 'R&B', 'Country',
                  'Indie', 'Alternative', 'Folk', 'Reggae', 'Blues', 'Metal', 'Punk', 'Soul'
                ].map((genre) => (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`p-3 rounded-lg border transition-all text-center ${
                      preferences.music_genres.includes(genre)
                        ? 'border-purple-400 bg-purple-500/20 text-white'
                        : 'border-white/20 bg-white/5 text-purple-200 hover:bg-white/10'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
              
              {preferences.music_genres.length > 0 && (
                <div className="mt-4 p-3 bg-green-500/20 border border-green-400/30 rounded-lg">
                  <p className="text-green-200 text-sm">
                    ✓ Selected {preferences.music_genres.length} genre{preferences.music_genres.length > 1 ? 's' : ''}: {preferences.music_genres.join(', ')}
                  </p>
                </div>
              )}
              
              <div className="mt-8">
                <h4 className="text-white font-semibold mb-4">Typical playlist size you work with:</h4>
                <div className="flex gap-4">
                  {[
                    { id: 'small', label: '5-20 songs', description: 'Quick sessions' },
                    { id: 'medium', label: '21-50 songs', description: 'Most common' },
                    { id: 'large', label: '50+ songs', description: 'Extended listening' }
                  ].map((size) => (
                    <button
                      key={size.id}
                      onClick={() => updatePreference('playlist_size_preference', size.id)}
                      className={`p-4 rounded-lg border transition-all text-center flex-1 ${
                        preferences.playlist_size_preference === size.id
                          ? 'border-purple-400 bg-purple-500/20'
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-white font-medium">{size.label}</div>
                      <div className="text-purple-200 text-sm">{size.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Features Overview Step */}
          {currentStep === 4 && (
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">What you can do with AI Playlist Reordering</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Brain className="w-5 h-5 text-blue-400" />
                    </div>
                    <h4 className="text-white font-semibold">Smart Reordering</h4>
                  </div>
                  <ul className="text-purple-200 text-sm space-y-2">
                    <li>• Energy flow optimization</li>
                    <li>• Mood progression mapping</li>
                    <li>• Genre blending intelligence</li>
                    <li>• Tempo and key transitions</li>
                  </ul>
                </div>

                <div className="bg-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <h4 className="text-white font-semibold">Preview & Control</h4>
                  </div>
                  <ul className="text-purple-200 text-sm space-y-2">
                    <li>• See changes before applying</li>
                    <li>• Manual fine-tuning with drag & drop</li>
                    <li>• Track preview playback</li>
                    <li>• Undo/redo capabilities</li>
                  </ul>
                </div>

                <div className="bg-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                    </div>
                    <h4 className="text-white font-semibold">Multiple Styles</h4>
                  </div>
                  <ul className="text-purple-200 text-sm space-y-2">
                    <li>• Energy-based flow</li>
                    <li>• Mood progression</li>
                    <li>• Genre clustering</li>
                    <li>• Custom algorithms</li>
                  </ul>
                </div>

                <div className="bg-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-orange-400" />
                    </div>
                    <h4 className="text-white font-semibold">Async Processing</h4>
                  </div>
                  <ul className="text-purple-200 text-sm space-y-2">
                    <li>• Background processing for large playlists</li>
                    <li>• Real-time progress tracking</li>
                    <li>• Continue browsing while AI works</li>
                    <li>• Job history and management</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Completion Step */}
          {currentStep === 5 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">You're All Set!</h3>
              <p className="text-purple-200 text-lg mb-8 max-w-2xl mx-auto">
                Based on your preferences, we've customized the experience for you. 
                Ready to create your first AI-optimized playlist?
              </p>

              <div className="bg-white/10 rounded-2xl p-6 mb-8 max-w-lg mx-auto">
                <h4 className="text-white font-semibold mb-4">Your Profile Summary</h4>
                <div className="text-left space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-purple-200">Experience Level:</span>
                    <span className="text-white capitalize">{preferences.experience_level.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-200">Primary Use:</span>
                    <span className="text-white capitalize">{preferences.primary_use_case.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-200">Favorite Genres:</span>
                    <span className="text-white">{preferences.music_genres.slice(0, 3).join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-200">Playlist Size:</span>
                    <span className="text-white capitalize">{preferences.playlist_size_preference}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={onStartTutorial}
                  className="flex items-center gap-2 px-6 py-3 bg-white/20 border border-white/30 rounded-xl text-white hover:bg-white/30 transition-all"
                >
                  <Play className="w-4 h-4" />
                  Take Quick Tutorial
                </button>
                <button
                  onClick={handleComplete}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/25"
                >
                  Start Creating
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        {currentStep === 0 && (
          <div className="p-6 border-t border-white/10 flex justify-center">
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/25"
            >
              Let's Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {currentStep > 0 && currentStep < 5 && (
          <div className="p-6 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={handlePrevious}
              className="flex items-center gap-2 px-4 py-2 text-purple-200 hover:text-white transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && !preferences.experience_level) ||
                (currentStep === 2 && !preferences.primary_use_case) ||
                (currentStep === 3 && preferences.music_genres.length < 2)
              }
              className="flex items-center gap-2 px-6 py-2 bg-purple-500 text-white font-medium rounded-lg hover:bg-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === 4 ? 'Complete Setup' : 'Next'} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserOnboarding;
