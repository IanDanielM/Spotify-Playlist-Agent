import React, { useState, useEffect } from 'react';
import { Music } from 'lucide-react';

interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
}

interface PlaylistSelectionProps {
  onPlaylistSelected: (playlistId: string) => void;
}

const PlaylistSelection: React.FC<PlaylistSelectionProps> = ({ onPlaylistSelected }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
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

    fetchPlaylists();
  }, []);

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
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">Select a Playlist</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className="bg-gray-800 rounded-lg p-4 flex flex-col items-center cursor-pointer hover:bg-gray-700 transition-colors"
            onClick={() => onPlaylistSelected(playlist.id)}
          >
            {playlist.images.length > 0 ? (
              <img src={playlist.images[0].url} alt={playlist.name} className="w-48 h-48 object-cover rounded-md mb-4" />
            ) : (
              <div className="w-48 h-48 bg-gray-700 rounded-md mb-4 flex items-center justify-center">
                <Music className="w-24 h-24 text-gray-500" />
              </div>
            )}
            <p className="text-lg font-semibold text-center">{playlist.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlaylistSelection;