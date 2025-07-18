import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  ExternalLink, 
  Music, 
  ArrowRight,
  Clock,
  Volume2
} from 'lucide-react';

interface Track {
  position: number;
  track_id: string;
  name: string;
  artist: string;
  album_name: string;
  popularity: number;
  moved_from?: number;
  preview_url?: string;
  duration_ms?: number;
  external_urls?: {
    spotify: string;
  };
}

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlistId: string;
  playlistName?: string;
  onEditPlaylist: () => void;
}

const PlaylistPreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  playlistId,
  playlistName,
  onEditPlaylist
}) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen && playlistId) {
      fetchPlaylistPreview();
    }
  }, [isOpen, playlistId]);

  useEffect(() => {
    // Cleanup audio on unmount or close
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [audio]);

  const fetchPlaylistPreview = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/playlist/${playlistId}/tracks`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch playlist');
      }

      const data = await response.json();
      
      // Show only first 15 tracks for quick preview
      const previewTracks = data.tracks.slice(0, 15).map((track: any, index: number) => ({
        position: index,
        track_id: track.track_id,
        name: track.name,
        artist: track.artist,
        album_name: track.album_name,
        popularity: track.popularity || 0,
        preview_url: track.preview_url,
        duration_ms: track.duration_ms,
        external_urls: track.external_urls
      }));
      
      setTracks(previewTracks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load playlist');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms?: number): string => {
    if (!ms) return '--:--';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const playPreview = async (track: Track) => {
    // Stop current audio if playing the same track
    if (currentlyPlaying === track.track_id) {
      if (audio) {
        audio.pause();
        setAudio(null);
      }
      setCurrentlyPlaying(null);
      return;
    }

    // Stop any currently playing audio
    if (audio) {
      audio.pause();
      setAudio(null);
    }

    if (track.preview_url) {
      try {
        const newAudio = new Audio(track.preview_url);
        newAudio.volume = 0.3;
        setAudio(newAudio);
        setCurrentlyPlaying(track.track_id);
        
        newAudio.onended = () => {
          setCurrentlyPlaying(null);
          setAudio(null);
        };
        
        newAudio.onerror = () => {
          setCurrentlyPlaying(null);
          setAudio(null);
        };
        
        await newAudio.play();
      } catch (error) {
        console.error('Error playing preview:', error);
        setCurrentlyPlaying(null);
        setAudio(null);
      }
    }
  };

  const handleEditPlaylist = () => {
    // Stop any playing audio
    if (audio) {
      audio.pause();
      setAudio(null);
    }
    setCurrentlyPlaying(null);
    
    // Close modal and trigger edit mode
    onClose();
    onEditPlaylist();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Quick Preview</h2>
            <p className="text-gray-400 mt-1">
              {playlistName || 'Playlist Preview'} • First {tracks.length} tracks
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
              <span className="ml-3 text-gray-400">Loading preview...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="text-red-400 mb-2">{error}</div>
              <button
                onClick={fetchPlaylistPreview}
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && tracks.length > 0 && (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {tracks.map((track) => (
                <div
                  key={track.track_id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors group"
                >
                  <div className="flex-shrink-0 w-8 text-center">
                    <span className="text-sm text-gray-400">{track.position + 1}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">{track.name}</div>
                    <div className="text-sm text-gray-400 truncate">{track.artist}</div>
                  </div>
                  
                  <div className="flex-shrink-0 text-sm text-gray-500">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {formatDuration(track.duration_ms)}
                  </div>
                  
                  <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {track.preview_url && (
                      <button
                        onClick={() => playPreview(track)}
                        className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                        title={currentlyPlaying === track.track_id ? 'Pause' : 'Play preview'}
                      >
                        {currentlyPlaying === track.track_id ? (
                          <Pause className="w-4 h-4 text-green-400" />
                        ) : (
                          <Play className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    )}
                    
                    {track.external_urls?.spotify && (
                      <button
                        onClick={() => window.open(track.external_urls?.spotify, '_blank')}
                        className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                        title="Open in Spotify"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && tracks.length === 0 && (
            <div className="text-center py-12">
              <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No tracks found in this playlist</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && tracks.length > 0 && (
          <div className="flex items-center justify-between p-6 border-t border-gray-700 bg-gray-800/50">
            <div className="text-sm text-gray-400">
              Showing first {tracks.length} tracks • Full playlist preview available in edit mode
            </div>
            <button
              onClick={handleEditPlaylist}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              <span>Edit & Reorder</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistPreviewModal;
