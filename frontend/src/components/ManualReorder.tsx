import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  GripVertical, 
  Play, 
  Pause,
  Volume2,
  VolumeX,
  ExternalLink,
  Music,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface Track {
  position: number;
  track_id: string;
  name: string;
  artist: string;
  album_name: string;
  preview_url?: string;
  duration_ms?: number;
  external_urls?: {
    spotify: string;
  };
}

interface PlaylistData {
  tracks: Track[];
  total_tracks: number;
  playlist_name: string;
  snapshot_id: string;
  showing_tracks: number;
}

interface ManualReorderProps {
  playlistId: string;
  onBack: () => void;
}

const ManualReorder: React.FC<ManualReorderProps> = ({ playlistId, onBack }) => {
  const [playlistData, setPlaylistData] = useState<PlaylistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [draggedTrack, setDraggedTrack] = useState<Track | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [reorderingTrack, setReorderingTrack] = useState<number | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [snapshotId, setSnapshotId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlaylistData();
    return () => {
      if (currentAudio) {
        currentAudio.pause();
      }
    };
  }, [playlistId]);

  const fetchPlaylistData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/playlist/${playlistId}/tracks`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setPlaylistData(data);
        setSnapshotId(data.snapshot_id);
      } else {
        setError('Failed to load playlist');
      }
    } catch (error) {
      console.error('Error fetching playlist:', error);
      setError('Failed to load playlist');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, track: Track) => {
    setDraggedTrack(track);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (!draggedTrack || !playlistData || reorderingTrack !== null) return;

    const sourceIndex = draggedTrack.position;
    
    // Don't do anything if dropped on same position
    if (sourceIndex === dropIndex) {
      setDraggedTrack(null);
      return;
    }

    // Calculate the correct insert_before index for Spotify API
    let insertBefore = dropIndex;
    if (sourceIndex < dropIndex) {
      // Moving track down - insert_before should be dropIndex + 1
      insertBefore = dropIndex + 1;
    }

    setReorderingTrack(sourceIndex);

    try {
      const response = await fetch('/api/reorder-track', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          playlist_id: playlistId,
          range_start: sourceIndex,
          insert_before: insertBefore,
          range_length: 1,
          snapshot_id: snapshotId
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Update snapshot_id for future operations
        setSnapshotId(result.snapshot_id);
        
        // Update local state to reflect the change
        const newTracks = [...playlistData.tracks];
        const [movedTrack] = newTracks.splice(sourceIndex, 1);
        newTracks.splice(dropIndex, 0, movedTrack);
        
        // Update positions
        const updatedTracks = newTracks.map((track, index) => ({
          ...track,
          position: index
        }));

        setPlaylistData({
          ...playlistData,
          tracks: updatedTracks
        });
      } else {
        console.error('Failed to reorder track');
        setError('Failed to reorder track. Please try again.');
      }
    } catch (error) {
      console.error('Error reordering track:', error);
      setError('Failed to reorder track. Please try again.');
    } finally {
      setReorderingTrack(null);
      setDraggedTrack(null);
    }
  };

  const togglePlayPreview = (track: Track) => {
    if (currentlyPlaying === track.track_id) {
      // Pause current track
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
        setCurrentlyPlaying(null);
      }
    } else {
      // Stop current audio and play new one
      if (currentAudio) {
        currentAudio.pause();
      }

      if (track.preview_url) {
        const audio = new Audio(track.preview_url);
        audio.volume = 0.3;
        audio.onended = () => {
          setCurrentlyPlaying(null);
          setCurrentAudio(null);
        };
        audio.onerror = () => {
          setCurrentlyPlaying(null);
          setCurrentAudio(null);
        };
        
        audio.play().catch(() => {
          console.log('Failed to play preview');
        });
        
        setCurrentAudio(audio);
        setCurrentlyPlaying(track.track_id);
      }
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading playlist...</p>
        </div>
      </div>
    );
  }

  if (error || !playlistData) {
    return (
      <div className="text-center">
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-6">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-300 mb-2">Error Loading Playlist</h3>
          <p className="text-red-200 mb-4">{error || 'Unable to load playlist data'}</p>
          <button
            onClick={onBack}
            className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white">{playlistData.playlist_name}</h2>
          <p className="text-gray-400">
            Manual Reorder • Showing {playlistData.showing_tracks} of {playlistData.total_tracks} tracks
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Music className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-blue-300 font-medium mb-1">Real-time Reordering</h4>
            <p className="text-blue-200 text-sm">
              Drag and drop tracks to reorder them. Changes are applied immediately to your Spotify playlist.
            </p>
          </div>
        </div>
      </div>

      {/* Track List */}
      <div className="space-y-2">
        {playlistData.tracks.map((track, index) => (
          <div
            key={track.track_id}
            draggable
            onDragStart={(e) => handleDragStart(e, track)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            className={`
              bg-gray-800/50 border border-gray-700 rounded-lg p-4 transition-all cursor-move
              ${dragOverIndex === index ? 'border-purple-500/50 bg-purple-900/20' : ''}
              ${reorderingTrack === index ? 'opacity-50' : ''}
              hover:bg-gray-700/50 hover:border-gray-600
            `}
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <GripVertical className="w-5 h-5 text-gray-500" />
                <span className="text-gray-400 font-mono text-sm w-8">
                  {reorderingTrack === index ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    index + 1
                  )}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium truncate">{track.name}</h4>
                <p className="text-gray-400 text-sm truncate">{track.artist} • {track.album_name}</p>
              </div>

              <div className="flex items-center gap-2">
                {track.duration_ms && (
                  <span className="text-gray-400 text-sm">
                    {formatDuration(track.duration_ms)}
                  </span>
                )}
                
                {track.preview_url && (
                  <button
                    onClick={() => togglePlayPreview(track)}
                    className="p-2 bg-green-600 hover:bg-green-500 rounded-full transition-colors"
                    title="Play preview"
                  >
                    {currentlyPlaying === track.track_id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                )}
                
                {track.external_urls?.spotify && (
                  <a
                    href={track.external_urls.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-600 hover:bg-gray-500 rounded-full transition-colors"
                    title="Open in Spotify"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {playlistData.showing_tracks < playlistData.total_tracks && (
        <div className="text-center text-gray-400 text-sm">
          Showing first {playlistData.showing_tracks} tracks. For full playlist management, use the Spotify app.
        </div>
      )}
    </div>
  );
};

export default ManualReorder;
