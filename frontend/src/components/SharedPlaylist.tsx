import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Music, ExternalLink, ArrowLeft, Clock, User } from 'lucide-react';

interface PlaylistData {
  id: string;
  name: string;
  description: string;
  owner: string;
  public: boolean;
  collaborative: boolean;
  tracks: Array<{
    track_id: string;
    name: string;
    artist: string;
    album: string;
    duration_ms: number;
  }>;
}

const SharedPlaylist: React.FC = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const [playlist, setPlaylist] = useState<PlaylistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (playlistId) {
      fetchPlaylistData(playlistId);
    }
  }, [playlistId]);

  const fetchPlaylistData = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/shared-playlist/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        setPlaylist(data);
      } else if (response.status === 404) {
        setError('Playlist not found or not shared');
      } else {
        setError('Failed to load playlist');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const openSpotifyPlaylist = () => {
    if (playlist) {
      window.open(`https://open.spotify.com/playlist/${playlist.id}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-spotify-green border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-4">Loading Playlist...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <Music className="w-16 h-16 text-gray-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">Playlist Not Available</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link 
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-spotify-green hover:bg-spotify-light text-black font-semibold rounded-full transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-spotify-green hover:text-spotify-light mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Link>
          
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{playlist.name}</h1>
                {playlist.description && (
                  <p className="text-gray-400 mb-4">{playlist.description}</p>
                )}
                <div className="flex items-center gap-6 text-sm text-gray-400">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {playlist.owner}
                  </span>
                  <span className="flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    {playlist.tracks.length} tracks
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {Math.round(playlist.tracks.reduce((total, track) => total + track.duration_ms, 0) / 60000)} min
                  </span>
                </div>
              </div>
              
              <button
                onClick={openSpotifyPlaylist}
                className="flex items-center gap-2 px-4 py-2 bg-spotify-green hover:bg-spotify-light text-black font-semibold rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Spotify
              </button>
            </div>
          </div>
        </div>

        {/* Track List */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Tracks</h2>
            <p className="text-gray-400 text-sm mt-1">
              This playlist has been reordered with AI to create a better listening experience
            </p>
          </div>
          
          <div className="divide-y divide-gray-700">
            {playlist.tracks.map((track, index) => (
              <div key={track.track_id} className="p-4 hover:bg-gray-700/30 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="text-gray-400 text-sm w-6 text-right">
                    {index + 1}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">
                      {track.name}
                    </h3>
                    <p className="text-gray-400 text-sm truncate">
                      {track.artist} • {track.album}
                    </p>
                  </div>
                  
                  <span className="text-gray-400 text-sm">
                    {formatDuration(track.duration_ms)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Reordered with ✨ <Link to="/" className="text-spotify-green hover:text-spotify-light">Spotify Narrative Agent</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SharedPlaylist;
