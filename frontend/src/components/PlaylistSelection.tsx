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

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const response = await fetch('/api/spotify/playlists', { credentials: 'include' });
        const data = await response.json();
        setPlaylists(data.items);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching playlists:', error);
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  if (loading) {
    return (
      <div className="text-center">
        <p>Loading your playlists...</p>
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