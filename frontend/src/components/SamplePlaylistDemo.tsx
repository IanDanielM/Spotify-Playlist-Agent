import React, { useState } from 'react';
import { Music, Sparkles, Play, ArrowRight, RefreshCw } from 'lucide-react';

interface SamplePlaylistDemoProps {
  onClose: () => void;
  onSignUpPrompt: () => void;
}

const samplePlaylists = [
  {
    id: 'workout-mix',
    name: 'High Energy Workout Mix',
    description: 'Perfect for gym sessions and cardio',
    tracks: 32,
    genre: 'Electronic/Pop',
    originalOrder: [
      { name: 'Shape of You', artist: 'Ed Sheeran', energy: 65 },
      { name: 'Blinding Lights', artist: 'The Weeknd', energy: 78 },
      { name: 'Don\'t Start Now', artist: 'Dua Lipa', energy: 82 },
      { name: 'Watermelon Sugar', artist: 'Harry Styles', energy: 70 },
      { name: 'Levitating', artist: 'Dua Lipa', energy: 85 },
      { name: 'Good 4 U', artist: 'Olivia Rodrigo', energy: 75 },
      { name: 'Industry Baby', artist: 'Lil Nas X & Jack Harlow', energy: 88 },
      { name: 'Heat Waves', artist: 'Glass Animals', energy: 68 },
      { name: 'Stay', artist: 'The Kid LAROI & Justin Bieber', energy: 72 },
      { name: 'Physical', artist: 'Dua Lipa', energy: 90 }
    ],
    reorderedTracks: [
      { name: 'Physical', artist: 'Dua Lipa', energy: 90, moved_from: 9 },
      { name: 'Industry Baby', artist: 'Lil Nas X & Jack Harlow', energy: 88, moved_from: 6 },
      { name: 'Levitating', artist: 'Dua Lipa', energy: 85, moved_from: 4 },
      { name: 'Don\'t Start Now', artist: 'Dua Lipa', energy: 82, moved_from: 2 },
      { name: 'Blinding Lights', artist: 'The Weeknd', energy: 78, moved_from: 1 },
      { name: 'Good 4 U', artist: 'Olivia Rodrigo', energy: 75, moved_from: 5 },
      { name: 'Stay', artist: 'The Kid LAROI & Justin Bieber', energy: 72, moved_from: 8 },
      { name: 'Watermelon Sugar', artist: 'Harry Styles', energy: 70, moved_from: 3 },
      { name: 'Heat Waves', artist: 'Glass Animals', energy: 68, moved_from: 7 },
      { name: 'Shape of You', artist: 'Ed Sheeran', energy: 65, moved_from: 0 }
    ],
    strategy: 'High Energy First',
    improvements: {
      energyFlow: '+32%',
      pacing: '+28%',
      engagement: '+41%'
    }
  },
  {
    id: 'chill-vibes',
    name: 'Sunday Morning Chill',
    description: 'Relaxing tracks for a peaceful morning',
    tracks: 28,
    genre: 'Indie/Alternative',
    originalOrder: [
      { name: 'Circles', artist: 'Post Malone', energy: 45 },
      { name: 'Sweater Weather', artist: 'The Neighbourhood', energy: 52 },
      { name: 'Somebody Else', artist: 'The 1975', energy: 48 },
      { name: 'Electric Feel', artist: 'MGMT', energy: 65 },
      { name: 'Are You Bored Yet?', artist: 'Wallows', energy: 55 },
      { name: 'Golden', artist: 'Harry Styles', energy: 42 },
      { name: 'Sunflower', artist: 'Post Malone & Swae Lee', energy: 58 },
      { name: 'Dreams Tonite', artist: 'Alvvays', energy: 40 },
      { name: 'Stolen Dance', artist: 'Milky Chance', energy: 50 },
      { name: 'Cherry', artist: 'Harry Styles', energy: 35 }
    ],
    reorderedTracks: [
      { name: 'Cherry', artist: 'Harry Styles', energy: 35, moved_from: 9 },
      { name: 'Dreams Tonite', artist: 'Alvvays', energy: 40, moved_from: 7 },
      { name: 'Golden', artist: 'Harry Styles', energy: 42, moved_from: 5 },
      { name: 'Circles', artist: 'Post Malone', energy: 45, moved_from: 0 },
      { name: 'Somebody Else', artist: 'The 1975', energy: 48, moved_from: 2 },
      { name: 'Stolen Dance', artist: 'Milky Chance', energy: 50, moved_from: 8 },
      { name: 'Sweater Weather', artist: 'The Neighbourhood', energy: 52, moved_from: 1 },
      { name: 'Are You Bored Yet?', artist: 'Wallows', energy: 55, moved_from: 4 },
      { name: 'Sunflower', artist: 'Post Malone & Swae Lee', energy: 58, moved_from: 6 },
      { name: 'Electric Feel', artist: 'MGMT', energy: 65, moved_from: 3 }
    ],
    strategy: 'Gradual Energy Build',
    improvements: {
      energyFlow: '+24%',
      pacing: '+19%',
      engagement: '+26%'
    }
  }
];

const SamplePlaylistDemo: React.FC<SamplePlaylistDemoProps> = ({ 
  onClose, 
  onSignUpPrompt 
}) => {
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [animatingReorder, setAnimatingReorder] = useState(false);

  const currentPlaylist = samplePlaylists.find(p => p.id === selectedPlaylist);

  const handleReorderDemo = () => {
    setAnimatingReorder(true);
    setTimeout(() => {
      setAnimatingReorder(false);
      setShowComparison(true);
    }, 2000);
  };

  const TrackMovementIndicator = ({ track, index }: { track: any, index: number }) => {
    if (!track.moved_from || track.moved_from === index) return null;
    
    const direction = track.moved_from > index ? 'up' : 'down';
    const distance = Math.abs(track.moved_from - index);
    
    return (
      <div className={`flex items-center gap-1 text-xs ${
        direction === 'up' ? 'text-green-400' : 'text-blue-400'
      }`}>
        <ArrowRight size={12} className={direction === 'up' ? 'rotate-[-90deg]' : 'rotate-90'} />
        <span>{distance}</span>
      </div>
    );
  };

  if (selectedPlaylist && currentPlaylist) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white">{currentPlaylist.name}</h2>
                <p className="text-gray-400 mt-1">{currentPlaylist.description}</p>
                <div className="flex gap-4 text-sm text-gray-400 mt-2">
                  <span>{currentPlaylist.tracks} tracks</span>
                  <span>{currentPlaylist.genre}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
          </div>

          {/* Demo Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {!showComparison ? (
              <>
                {/* Original Order */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Original Order</h3>
                  <div className="space-y-2">
                    {currentPlaylist.originalOrder.map((track, index) => (
                      <div 
                        key={index}
                        className={`flex items-center gap-4 p-3 bg-gray-800 rounded-lg ${
                          animatingReorder ? 'animate-pulse' : ''
                        }`}
                      >
                        <span className="text-gray-400 text-sm w-6">{index + 1}</span>
                        <div className="flex-1">
                          <div className="text-white font-medium">{track.name}</div>
                          <div className="text-gray-400 text-sm">{track.artist}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400">Energy</div>
                          <div className="text-sm text-spotify-green">{track.energy}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                {!animatingReorder ? (
                  <div className="text-center">
                    <button
                      onClick={handleReorderDemo}
                      className="px-8 py-4 bg-spotify-green text-black rounded-lg font-bold text-lg hover:bg-green-400 transition-colors flex items-center gap-2 mx-auto"
                    >
                      <Sparkles size={24} />
                      Apply AI Reordering
                    </button>
                    <p className="text-gray-400 text-sm mt-2">
                      Strategy: {currentPlaylist.strategy}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 border-4 border-spotify-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white font-semibold">Analyzing tracks and optimizing order...</p>
                    <p className="text-gray-400 text-sm mt-2">Using AI to create the perfect flow</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Before/After Comparison */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Before */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Before</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {currentPlaylist.originalOrder.map((track, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-gray-800 rounded">
                          <span className="text-gray-400 text-sm w-6">{index + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm truncate">{track.name}</div>
                            <div className="text-gray-400 text-xs truncate">{track.artist}</div>
                          </div>
                          <div className="text-xs text-gray-400">{track.energy}%</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* After */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">After</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {currentPlaylist.reorderedTracks.map((track, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-gray-800 rounded">
                          <span className="text-gray-400 text-sm w-6">{index + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm truncate">{track.name}</div>
                            <div className="text-gray-400 text-xs truncate">{track.artist}</div>
                          </div>
                          <TrackMovementIndicator track={track} index={index} />
                          <div className="text-xs text-gray-400">{track.energy}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Improvements Summary */}
                <div className="mt-6 p-4 bg-gradient-to-r from-spotify-green/20 to-green-600/20 rounded-lg border border-spotify-green/30">
                  <h4 className="text-lg font-semibold text-white mb-3">Improvements</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-spotify-green">
                        {currentPlaylist.improvements.energyFlow}
                      </div>
                      <div className="text-sm text-gray-400">Energy Flow</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-spotify-green">
                        {currentPlaylist.improvements.pacing}
                      </div>
                      <div className="text-sm text-gray-400">Pacing</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-spotify-green">
                        {currentPlaylist.improvements.engagement}
                      </div>
                      <div className="text-sm text-gray-400">Engagement</div>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-6 text-center">
                  <button
                    onClick={onSignUpPrompt}
                    className="px-8 py-4 bg-spotify-green text-black rounded-lg font-bold text-lg hover:bg-green-400 transition-colors"
                  >
                    Try This On Your Playlists
                  </button>
                  <p className="text-gray-400 text-sm mt-2">
                    Sign up to reorder your actual Spotify playlists
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl max-w-4xl w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Try Our AI Demo</h2>
            <p className="text-gray-400 mt-1">
              See how our AI reorders playlists for better flow
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        {/* Sample Playlists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {samplePlaylists.map((playlist) => (
            <div
              key={playlist.id}
              className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => setSelectedPlaylist(playlist.id)}
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-spotify-green to-green-600 rounded-lg flex items-center justify-center">
                  <Music className="w-8 h-8 text-black" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{playlist.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">{playlist.description}</p>
                  <div className="flex gap-4 text-xs text-gray-400 mt-3">
                    <span>{playlist.tracks} tracks</span>
                    <span>{playlist.genre}</span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            No login required • See the magic in action
          </p>
        </div>
      </div>
    </div>
  );
};

export default SamplePlaylistDemo;
