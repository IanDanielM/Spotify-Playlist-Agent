import React, { useState } from 'react';
import PlaylistSelection from './PlaylistSelection';
import ReorderStyle from './ReorderStyle';
import { Music, Zap, Sparkles, Brain, ArrowLeft } from 'lucide-react';

type Step = 'playlist' | 'style' | 'reordering' | 'success' | 'error';

const Dashboard: React.FC = () => {
  const [step, setStep] = useState<Step>('playlist');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

  const handlePlaylistSelected = (playlistId: string) => {
    setSelectedPlaylist(playlistId);
    setStep('style');
  };

  const handleReorder = async (style: string) => {
    if (!selectedPlaylist) return;

    setSelectedStyle(style);
    setStep('reordering');

    try {
      const response = await fetch('/api/reorder-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playlist_id: selectedPlaylist,
          reorder_style: style,
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
    if (step === 'style') {
      setStep('playlist');
    }
  };
  
  const handleReset = () => {
    setStep('playlist');
    setSelectedPlaylist(null);
    setSelectedStyle(null);
  }

  const renderContent = () => {
    switch (step) {
      case 'playlist':
        return <PlaylistSelection onPlaylistSelected={handlePlaylistSelected} />;
      case 'style':
        return (
          <div>
            <button onClick={handleBack} className="flex items-center gap-2 mb-8 text-spotify-light hover:text-white transition-colors">
              <ArrowLeft size={20} /> Back to Playlists
            </button>
            <ReorderStyle onReorder={handleReorder} />
          </div>
        );
      case 'reordering':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-24 w-24 border-4 border-spotify-green/20 border-t-spotify-green mx-auto mb-8"></div>
            <h2 className="text-3xl font-bold text-white mb-4">AI is working its magic...</h2>
            <p className="text-gray-400 text-lg">Analyzing and reordering your playlist.</p>
          </div>
        );
      case 'success':
        return (
          <div className="text-center">
            <Sparkles className="w-24 h-24 text-spotify-green mx-auto mb-8" />
            <h2 className="text-3xl font-bold mb-4">Playlist Reordered!</h2>
            <p className="text-gray-300 mb-8">Your playlist has been successfully reordered. Check it out on Spotify!</p>
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
      <div className="bg-gray-900/50 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;
