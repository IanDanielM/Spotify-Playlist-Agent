import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Pause,
  Volume2,
  VolumeX,
  GripVertical,
  Save,
  RotateCcw,
  CheckCircle,
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

interface RealTimePlaylistReorderProps {
  playlistId: string;
  onBack: () => void;
  onSaveComplete?: () => void;
}

const RealTimePlaylistReorder: React.FC<RealTimePlaylistReorderProps> = ({ 
  playlistId, 
  onBack, 
  onSaveComplete 
}) => {
  const [playlistData, setPlaylistData] = useState<PlaylistData | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedTrack, setDraggedTrack] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [reorderingTrack, setReorderingTrack] = useState<number | null>(null);
  const [snapshotId, setSnapshotId] = useState<string>('');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch playlist data on mount
  useEffect(() => {
    fetchPlaylistData();
  }, [playlistId]);

  const fetchPlaylistData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/playlist/${playlistId}/tracks`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch playlist data');
      }

      const data: PlaylistData = await response.json();
      setPlaylistData(data);
      setTracks(data.tracks);
      setSnapshotId(data.snapshot_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedTrack(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedTrack(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedTrack === null || draggedTrack === dropIndex) {
      handleDragEnd();
      return;
    }

    setReorderingTrack(draggedTrack);
    
    try {
      // Call the real-time reorder API
      const response = await fetch('/api/reorder-track', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          playlist_id: playlistId,
          range_start: draggedTrack,
          insert_before: dropIndex > draggedTrack ? dropIndex + 1 : dropIndex,
          range_length: 1,
          snapshot_id: snapshotId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reorder track');
      }

      const result = await response.json();
      
      // Update the snapshot ID
      if (result.snapshot_id) {
        setSnapshotId(result.snapshot_id);
      }

      // Update local tracks order immediately for better UX
      const newTracks = [...tracks];
      const movedTrack = newTracks.splice(draggedTrack, 1)[0];
      newTracks.splice(dropIndex > draggedTrack ? dropIndex : dropIndex, 0, movedTrack);
      
      // Update positions
      const updatedTracks = newTracks.map((track, index) => ({
        ...track,
        position: index
      }));
      
      setTracks(updatedTracks);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder track');
      console.error('Reorder error:', err);
    } finally {
      setReorderingTrack(null);
      handleDragEnd();
    }
  };

  const playPreview = (track: Track) => {
    if (!track.preview_url) return;

    // Stop current audio if playing
    if (currentAudio) {
      currentAudio.pause();
      setPlayingTrackId(null);
    }

    if (playingTrackId === track.track_id) {
      setCurrentAudio(null);
      setPlayingTrackId(null);
      return;
    }

    const audio = new Audio(track.preview_url);
    audio.volume = 0.5;
    
    audio.addEventListener('ended', () => {
      setPlayingTrackId(null);
      setCurrentAudio(null);
    });
    
    audio.play().then(() => {
      setCurrentAudio(audio);
      setPlayingTrackId(track.track_id);
    }).catch((err) => {
      console.error('Audio play failed:', err);
    });
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setPlayingTrackId(null);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading playlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 max-w-md">
            <h3 className="text-red-400 font-semibold mb-2">Error</h3>
            <p className="text-gray-300 mb-4">{error}</p>
            <button
              onClick={onBack}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">Manual Reorder</h2>
            <p className="text-gray-400">
              {playlistData?.playlist_name} • {tracks.length} tracks
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {currentAudio && (
            <button
              onClick={stopAudio}
              className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            >
              <VolumeX className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => window.open(`https://open.spotify.com/playlist/${playlistId}`, '_blank')}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Open in Spotify
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4 mb-6">
        <p className="text-blue-200 text-sm">
          <strong>Real-time reordering:</strong> Drag and drop tracks to reorder them. 
          Changes are applied immediately to your Spotify playlist!
        </p>
      </div>

      {/* Track List */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Tracks</h3>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {tracks.map((track, index) => (
            <div
              key={track.track_id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                flex items-center gap-4 p-4 border-b border-gray-700/50 cursor-move transition-all
                ${draggedTrack === index ? 'opacity-50' : ''}
                ${dragOverIndex === index ? 'bg-purple-500/20' : 'hover:bg-gray-700/50'}
                ${reorderingTrack === index ? 'bg-yellow-500/20' : ''}
              `}
            >
              <div className="flex items-center gap-3">
                {reorderingTrack === index ? (
                  <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                ) : (
                  <GripVertical className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-sm text-gray-400 w-8 text-right">
                  {index + 1}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium truncate">{track.name}</h4>
                <p className="text-gray-400 text-sm truncate">{track.artist}</p>
                {track.album_name && (
                  <p className="text-gray-500 text-xs truncate">{track.album_name}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {track.duration_ms && (
                  <span className="text-gray-400 text-sm">
                    {formatDuration(track.duration_ms)}
                  </span>
                )}
                
                {track.preview_url && (
                  <button
                    onClick={() => playPreview(track)}
                    className={`
                      p-2 rounded-lg transition-colors
                      ${playingTrackId === track.track_id 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'bg-gray-700 hover:bg-gray-600'
                      }
                    `}
                  >
                    {playingTrackId === track.track_id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 text-center text-gray-500 text-sm">
        Showing {tracks.length} of {playlistData?.total_tracks} tracks
        {playlistData && playlistData.total_tracks > playlistData.showing_tracks && (
          <span className="block mt-1">
            Note: Only the first 50 tracks are shown for manual reordering
          </span>
        )}
      </div>
    </div>
  );
};

export default RealTimePlaylistReorder;
