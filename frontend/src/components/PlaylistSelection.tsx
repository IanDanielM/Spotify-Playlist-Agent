import React, { useState, useEffect } from 'react';
import { Music, Eye, Edit3, Play, Users } from 'lucide-react';

interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
  tracks?: { total: number };
  owner?: { display_name: string; id: string };
  description?: string;
}

interface PlaylistSelectionProps {
  onPlaylistSelected: (playlistId: string) => void;
  onPreviewPlaylist?: (playlistId: string) => void;
  onManualReorder?: (playlistId: string) => void;
  onTryDemo?: () => void;
}

const PlaylistSelection: React.FC<PlaylistSelectionProps> = ({ 
  onPlaylistSelected, 
  onPreviewPlaylist,
  onManualReorder,
  onTryDemo 
}) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOwned, setFilterOwned] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    const fetchUserAndPlaylists = async () => {
      try {
        // First get current user
        const userResponse = await fetch('/api/me', { credentials: 'include' });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setCurrentUserId(userData.user_id);
        }

        // Then fetch playlists
        const response = await fetch('/api/spotify/playlists', { credentials: 'include' });
        
        if (!response.ok) {
          if (response.status === 401) {
            setError('Please log in to Spotify to view your playlists.');
          } else {
            setError('Failed to fetch playlists. Please try again.');
          }
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        
        // Handle different response structures
        if (data && data.items && Array.isArray(data.items)) {
          setPlaylists(data.items);
        } else if (Array.isArray(data)) {
          setPlaylists(data);
        } else {
          console.error('Unexpected response format:', data);
          setError('Unexpected response format from server.');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching playlists:', error);
        setError('Failed to connect to the server.');
        setLoading(false);
      }
    };

    fetchUserAndPlaylists();
  }, []);

  const filteredPlaylists = filterOwned 
    ? playlists.filter(playlist => playlist.owner?.id === currentUserId)
    : playlists;

  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-spotify-green/20 border-t-spotify-green mx-auto mb-4"></div>
        <p className="text-gray-400">Loading your playlists...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-6">
          <h3 className="text-red-400 font-semibold mb-2">Error</h3>
          <p className="text-gray-300">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-spotify-green text-black rounded-lg font-semibold hover:bg-spotify-green/80 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!playlists.length) {
    return (
      <div className="text-center">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Playlists Found</h3>
          <p className="text-gray-400">Create some playlists on Spotify first!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">Select a Playlist</h2>
        <p className="text-gray-400 mb-6">Choose a playlist to transform with AI</p>
        
        {/* Filter Toggle */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => setFilterOwned(false)}
            className={`px-4 py-2 rounded-lg transition-all ${
              !filterOwned 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All Playlists ({playlists.length})
          </button>
          <button
            onClick={() => setFilterOwned(true)}
            className={`px-4 py-2 rounded-lg transition-all ${
              filterOwned 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            My Playlists ({playlists.filter(p => p.owner?.id === currentUserId).length})
          </button>
        </div>

        {/* Demo Button */}
        {onTryDemo && (
          <div className="mt-6">
            <button
              onClick={onTryDemo}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg transform hover:scale-105"
            >
              🎵 Try Our AI Demo (No Login Required)
            </button>
            <p className="text-gray-400 text-sm mt-2">
              See how our AI reorders playlists with sample data
            </p>
          </div>
        )}
      </div>
      
      {filteredPlaylists.length === 0 ? (
        <div className="text-center">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              {filterOwned ? 'No Playlists You Own' : 'No Playlists Found'}
            </h3>
            <p className="text-gray-400">
              {filterOwned 
                ? 'Create some playlists on Spotify or try "All Playlists"' 
                : 'Create some playlists on Spotify first!'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaylists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              currentUserId={currentUserId}
              onSelect={() => onPlaylistSelected(playlist.id)}
              onPreview={() => onPreviewPlaylist?.(playlist.id)}
              onManualReorder={() => onManualReorder?.(playlist.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface PlaylistCardProps {
  playlist: Playlist;
  currentUserId: string;
  onSelect: () => void;
  onPreview: () => void;
  onManualReorder: () => void;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({
  playlist,
  currentUserId,
  onSelect,
  onPreview,
  onManualReorder
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isOwner = playlist.owner?.id === currentUserId;

  return (
    <div 
      className="group relative bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      {/* Playlist Image */}
      <div className="aspect-square relative overflow-hidden">
        {playlist.images && playlist.images.length > 0 ? (
          <img 
            src={playlist.images[0].url} 
            alt={playlist.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Music className="w-20 h-20 text-white/80" />
          </div>
        )}
        
        {/* Hover Overlay with Actions */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="flex gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview();
                }}
                className="p-3 bg-blue-500 hover:bg-blue-600 rounded-full text-white transition-all shadow-lg"
                title="Quick Preview"
              >
                <Eye className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
                className="p-3 bg-green-500 hover:bg-green-600 rounded-full text-white transition-all shadow-lg"
                title="AI Reorder"
              >
                <Play className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onManualReorder();
                }}
                className="p-3 bg-purple-500 hover:bg-purple-600 rounded-full text-white transition-all shadow-lg"
                title="Manual Reorder"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Playlist Info */}
      <div className="p-4">
        <h3 className="text-white font-semibold text-lg mb-1 truncate" title={playlist.name}>
          {playlist.name}
        </h3>
        
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
          <Users className="w-4 h-4" />
          <span className={isOwner ? 'text-green-400' : ''}>
            {isOwner ? 'You' : playlist.owner?.display_name || 'Unknown'}
          </span>
          {playlist.tracks && (
            <>
              <span>•</span>
              <span>{playlist.tracks.total} tracks</span>
            </>
          )}
        </div>

        {playlist.description && (
          <p className="text-gray-500 text-xs line-clamp-2" title={playlist.description}>
            {playlist.description}
          </p>
        )}
      </div>

      {/* Owner Badge */}
      {isOwner && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
          Owner
        </div>
      )}
    </div>
  );
};

export default PlaylistSelection;