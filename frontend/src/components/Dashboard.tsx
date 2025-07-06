import React, { useState } from 'react';
import PlaylistSelection from './PlaylistSelection';
import UserIntent from './UserIntent';
import PersonalTone from './PersonalTone';
import ReorderStyle from './ReorderStyle';
import ReorderStrategy from './ReorderStrategy';
import { Music, Zap, Sparkles, Brain, ArrowLeft, Settings } from 'lucide-react';

type Step = 'playlist' | 'intent' | 'tone' | 'style' | 'strategy' | 'reordering' | 'success' | 'error';

const Dashboard: React.FC = () => {
  const [step, setStep] = useState<Step>('playlist');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [userIntent, setUserIntent] = useState<string | null>(null);
  const [personalTone, setPersonalTone] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [reorderMethod, setReorderMethod] = useState<string>('auto');

  const handlePlaylistSelected = (playlistId: string) => {
    setSelectedPlaylist(playlistId);
    setStep('intent');
  };

  const handleIntentSelected = (intent: string) => {
    setUserIntent(intent);
    setStep('tone');
  };

  const handleToneSelected = (tone: string | null, intent: string) => {
    setPersonalTone(tone);
    setUserIntent(intent);
    setStep('style');
  };

  const handleStyleSelected = (style: string) => {
    setSelectedStyle(style);
    setStep('strategy');
  };

  const handleStrategySelected = (method: string) => {
    setReorderMethod(method);
    handleReorder();
  };

  const handleReorder = async () => {
    if (!selectedPlaylist || !userIntent || !selectedStyle) return;

    setStep('reordering');

    try {
      const response = await fetch('/api/reorder-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playlist_id: selectedPlaylist,
          reorder_style: selectedStyle,
          user_intent: userIntent,
          personal_tone: personalTone,
          reorder_method: reorderMethod,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        setStep('success');
      } else {
        setStep('error');
      }
    } catch (error) {
      console.error('Error reordering playlist:', error);
      setStep('error');
    }
  };

  const handleBack = () => {
    if (step === 'intent') {
      setStep('playlist');
    } else if (step === 'tone') {
      setStep('intent');
    } else if (step === 'style') {
      setStep('tone');
    } else if (step === 'strategy') {
      setStep('style');
    }
  };
  
  const handleReset = () => {
    setStep('playlist');
    setSelectedPlaylist(null);
    setUserIntent(null);
    setPersonalTone(null);
    setSelectedStyle(null);
    setReorderMethod('auto');
  }

  const renderContent = () => {
    switch (step) {
      case 'playlist':
        return <PlaylistSelection onPlaylistSelected={handlePlaylistSelected} />;
      case 'intent':
        return (
          <UserIntent 
            onIntentSelected={handleIntentSelected}
            onBack={handleBack}
          />
        );
      case 'tone':
        return (
          <PersonalTone 
            userIntent={userIntent!}
            onToneSelected={handleToneSelected}
            onBack={handleBack}
          />
        );
      case 'style':
        return (
          <div>
            <button onClick={handleBack} className="flex items-center gap-2 mb-8 text-spotify-light hover:text-white transition-colors">
              <ArrowLeft size={20} /> Back to Personal Style
            </button>
            <ReorderStyle onStyleSelected={handleStyleSelected} />
          </div>
        );
      case 'strategy':
        return (
          <div>
            <button onClick={handleBack} className="flex items-center gap-2 mb-8 text-spotify-light hover:text-white transition-colors">
              <ArrowLeft size={20} /> Back to Reorder Style
            </button>
            <ReorderStrategy onStrategySelected={handleStrategySelected} />
          </div>
        );
      case 'reordering':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-24 w-24 border-4 border-spotify-green/20 border-t-spotify-green mx-auto mb-8"></div>
            <h2 className="text-3xl font-bold text-white mb-4">AI is working its magic...</h2>
            <p className="text-gray-400 text-lg">Analyzing and reordering your playlist with your personal preferences.</p>
            {userIntent && (
              <div className="mt-4 p-4 bg-gray-800/50 rounded-lg max-w-2xl mx-auto">
                <p className="text-gray-300 text-sm"><strong>Goal:</strong> {userIntent}</p>
                {personalTone && (
                  <p className="text-gray-300 text-sm mt-2"><strong>Style:</strong> {personalTone}</p>
                )}
              </div>
            )}
          </div>
        );
      case 'success':
        return (
          <div className="text-center">
            <Sparkles className="w-24 h-24 text-spotify-green mx-auto mb-8" />
            <h2 className="text-3xl font-bold mb-4">Playlist Reordered!</h2>
            <p className="text-gray-300 mb-4">Your playlist has been successfully reordered with your personal touch.</p>
            {userIntent && (
              <div className="mb-8 p-4 bg-gray-800/50 rounded-lg max-w-2xl mx-auto">
                <p className="text-gray-300 text-sm"><strong>Applied Goal:</strong> {userIntent}</p>
                {personalTone && (
                  <p className="text-gray-300 text-sm mt-2"><strong>Your Style:</strong> {personalTone}</p>
                )}
              </div>
            )}
            <p className="text-gray-400 mb-8">Check it out on Spotify!</p>
            <button onClick={handleReset} className="px-6 py-3 bg-spotify-green hover:bg-spotify-light rounded-full font-semibold transition-all duration-300">
              Reorder Another Playlist
            </button>
          </div>
        );
      case 'error':
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Error</h2>
            <p className="text-gray-300 mb-8">There was an error reordering your playlist. Please try again.</p>
            <button onClick={handleReset} className="px-6 py-3 bg-spotify-green hover:bg-spotify-light rounded-full font-semibold transition-all duration-300">
              Try Again
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Header with settings */}
      {step === 'playlist' && (
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Music className="w-8 h-8 text-spotify-green" />
            <h1 className="text-2xl font-bold text-white">AI Playlist Reorder</h1>
          </div>
          <a
            href="/settings"
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
            Settings
          </a>
        </div>
      )}
      
      <div className="bg-gray-900/50 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;
