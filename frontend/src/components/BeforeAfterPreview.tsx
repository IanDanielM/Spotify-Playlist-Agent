import React, { useState } from 'react';
import { ArrowLeft, Play, Pause, ArrowRight, CheckCircle, Volume2, Clock, Music, Shuffle, TrendingUp, Zap } from 'lucide-react';

interface Track {
  position: number;
  track_id: string;
  name: string;
  artist: string;
  album_name?: string;
  popularity?: number;
  moved_from?: number;
  preview_url?: string;
  duration_ms?: number;
  external_urls?: {
    spotify: string;
  };
  energy?: number;
  valence?: number;
  danceability?: number;
}

interface BeforeAfterPreviewProps {
  data: {
    original_tracks?: Track[];
    reordered_tracks?: Track[];
    playlist_name?: string;
    total_tracks?: number;
    changes_summary?: {
      tracks_moved?: number;
      flow_improvement?: string;
      energy_progression?: string;
      narrative_coherence?: string;
    };
    strategy_info?: string;
    improvements?: string[];
  };
  onApplyReorder: () => void;
  onBack: () => void;
}

const BeforeAfterPreview: React.FC<BeforeAfterPreviewProps> = ({
  data,
  onApplyReorder,
  onBack
}) => {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'changes-only'>('side-by-side');

  const handlePlayPreview = (track: Track) => {
    if (!track.preview_url) return;

    if (currentlyPlaying === track.track_id) {
      // Stop playing
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setCurrentlyPlaying(null);
      setAudio(null);
    } else {
      // Stop any currently playing audio
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }

      // Play new track
      const newAudio = new Audio(track.preview_url);
      newAudio.play().catch(console.error);
      newAudio.addEventListener('ended', () => {
        setCurrentlyPlaying(null);
        setAudio(null);
      });
      
      setCurrentlyPlaying(track.track_id);
      setAudio(newAudio);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getChangedTracks = () => {
    if (!data.original_tracks || !data.reordered_tracks) return [];
    
    return data.reordered_tracks.filter((track, index) => {
      const originalTrack = data.original_tracks![index];
      return originalTrack?.track_id !== track.track_id;
    });
  };

  const getEnergyColor = (energy?: number) => {
    if (!energy) return 'bg-gray-600';
    if (energy > 0.7) return 'bg-red-400';
    if (energy > 0.4) return 'bg-yellow-400';
    return 'bg-blue-400';
  };

  if (!data || (!data.original_tracks && !data.reordered_tracks)) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-6">
          <h3 className="text-red-400 font-semibold mb-2">Comparison Not Available</h3>
          <p className="text-gray-300">Unable to generate before/after comparison.</p>
        </div>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { 
    original_tracks = [], 
    reordered_tracks = [], 
    playlist_name, 
    total_tracks, 
    changes_summary, 
    strategy_info,
    improvements = []
  } = data;

  const changedTracks = getChangedTracks();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-spotify-light hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Strategy
        </button>
        <h1 className="text-3xl font-bold text-white">Before & After Preview</h1>
        <div></div>
      </div>

      {/* Playlist Info & Summary */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Music className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{playlist_name || 'Your Playlist'}</h2>
            <p className="text-gray-400">{total_tracks || original_tracks.length} tracks • {strategy_info || 'AI Reorder'}</p>
          </div>
        </div>

        {/* Changes Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Shuffle className="w-5 h-5 text-spotify-green" />
              <h3 className="text-spotify-green font-semibold">Tracks Moved</h3>
            </div>
            <p className="text-2xl font-bold text-white">
              {changes_summary?.tracks_moved || changedTracks.length}
            </p>
          </div>

          {changes_summary?.flow_improvement && (
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <h3 className="text-blue-400 font-semibold">Flow</h3>
              </div>
              <p className="text-sm text-white">{changes_summary.flow_improvement}</p>
            </div>
          )}

          {changes_summary?.energy_progression && (
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h3 className="text-yellow-400 font-semibold">Energy</h3>
              </div>
              <p className="text-sm text-white">{changes_summary.energy_progression}</p>
            </div>
          )}

          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h3 className="text-green-400 font-semibold">Status</h3>
            </div>
            <p className="text-sm text-white">Ready to Apply</p>
          </div>
        </div>

        {/* Improvements */}
        {improvements.length > 0 && (
          <div>
            <h3 className="text-spotify-green font-semibold mb-2">Key Improvements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {improvements.map((improvement, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{improvement}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode('side-by-side')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            viewMode === 'side-by-side' 
              ? 'bg-spotify-green text-black' 
              : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
        >
          Side by Side
        </button>
        <button
          onClick={() => setViewMode('changes-only')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            viewMode === 'changes-only' 
              ? 'bg-spotify-green text-black' 
              : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
        >
          Changes Only ({changedTracks.length})
        </button>
      </div>

      {/* Comparison View */}
      {viewMode === 'side-by-side' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Before */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700 bg-red-500/10">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Music className="w-5 h-5" />
                Original Order
              </h3>
              <p className="text-gray-400">Current playlist arrangement</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {original_tracks.slice(0, 10).map((track, index) => (
                <TrackRow
                  key={`original-${track.track_id}`}
                  track={track}
                  index={index}
                  isOriginal={true}
                  currentlyPlaying={currentlyPlaying}
                  onPlayPreview={handlePlayPreview}
                  formatDuration={formatDuration}
                />
              ))}
              {original_tracks.length > 10 && (
                <div className="p-4 text-center text-gray-400">
                  ... and {original_tracks.length - 10} more tracks
                </div>
              )}
            </div>
          </div>

          {/* After */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700 bg-green-500/10">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Shuffle className="w-5 h-5" />
                New Order
              </h3>
              <p className="text-gray-400">AI-optimized arrangement</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {reordered_tracks.slice(0, 10).map((track, index) => (
                <TrackRow
                  key={`reordered-${track.track_id}`}
                  track={track}
                  index={index}
                  isOriginal={false}
                  currentlyPlaying={currentlyPlaying}
                  onPlayPreview={handlePlayPreview}
                  formatDuration={formatDuration}
                  movedFrom={track.moved_from}
                />
              ))}
              {reordered_tracks.length > 10 && (
                <div className="p-4 text-center text-gray-400">
                  ... and {reordered_tracks.length - 10} more tracks
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Changes Only View */
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-spotify-green" />
              Track Changes
            </h3>
            <p className="text-gray-400">Only showing tracks that will move position</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {changedTracks.length > 0 ? (
              changedTracks.map((track, index) => (
                <TrackRow
                  key={`changed-${track.track_id}`}
                  track={track}
                  index={track.position - 1}
                  isOriginal={false}
                  currentlyPlaying={currentlyPlaying}
                  onPlayPreview={handlePlayPreview}
                  formatDuration={formatDuration}
                  movedFrom={track.moved_from}
                  showChange={true}
                />
              ))
            ) : (
              <div className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-400">No position changes needed - your playlist is already optimally ordered!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8 justify-center">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-semibold transition-colors"
        >
          Back to Strategy
        </button>
        <button
          onClick={onApplyReorder}
          className="px-8 py-3 bg-spotify-green hover:bg-spotify-green/80 text-black font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          Apply Reorder
        </button>
      </div>
    </div>
  );
};

// Track Row Component
interface TrackRowProps {
  track: Track;
  index: number;
  isOriginal: boolean;
  currentlyPlaying: string | null;
  onPlayPreview: (track: Track) => void;
  formatDuration: (ms: number) => string;
  movedFrom?: number;
  showChange?: boolean;
}

const TrackRow: React.FC<TrackRowProps> = ({
  track,
  index,
  isOriginal,
  currentlyPlaying,
  onPlayPreview,
  formatDuration,
  movedFrom,
  showChange = false
}) => {
  const hasMoved = movedFrom !== undefined && movedFrom !== track.position;

  return (
    <div
      className={`flex items-center gap-4 p-4 hover:bg-gray-700/30 transition-colors ${
        hasMoved && !isOriginal ? 'bg-spotify-green/10 border-l-4 border-l-spotify-green' : ''
      }`}
    >
      {/* Position */}
      <div className="w-8 text-right">
        <span className="text-gray-400 text-sm">{index + 1}</span>
      </div>

      {/* Play Button */}
      <button
        onClick={() => onPlayPreview(track)}
        disabled={!track.preview_url}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          track.preview_url
            ? 'bg-spotify-green hover:bg-spotify-green/80 text-black'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }`}
      >
        {currentlyPlaying === track.track_id ? (
          <Pause className="w-4 h-4" />
        ) : track.preview_url ? (
          <Play className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </button>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-medium truncate">{track.name}</h4>
        <p className="text-gray-400 text-sm truncate">{track.artist}</p>
        {track.album_name && (
          <p className="text-gray-500 text-xs truncate">{track.album_name}</p>
        )}
      </div>

      {/* Movement Indicator */}
      {showChange && hasMoved && (
        <div className="text-right">
          <span className="text-spotify-green text-sm font-medium">
            #{movedFrom} → #{track.position}
          </span>
        </div>
      )}

      {/* Duration */}
      {track.duration_ms && (
        <div className="flex items-center gap-1 text-gray-400 text-sm">
          <Clock className="w-3 h-3" />
          <span>{formatDuration(track.duration_ms)}</span>
        </div>
      )}
    </div>
  );
};

export default BeforeAfterPreview;
