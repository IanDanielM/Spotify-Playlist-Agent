import React, { useState } from 'react';
import { ArrowLeft, Play, Pause, Clock, Volume2, Music, CheckCircle, XCircle } from 'lucide-react';

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
}

interface PlaylistPreviewProps {
  previewData: {
    tracks?: Track[];
    playlist_name?: string;
    total_tracks?: number;
    changes_made?: number;
    strategy_used?: string;
    improvements?: string[];
  };
  onApplyChanges: () => void;
  onBack: () => void;
  loading: boolean;
}

const PlaylistPreview: React.FC<PlaylistPreviewProps> = ({
  previewData,
  onApplyChanges,
  onBack,
  loading
}) => {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

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

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-spotify-green/20 border-t-spotify-green mx-auto mb-4"></div>
        <p className="text-gray-400">Generating preview...</p>
      </div>
    );
  }

  if (!previewData || !previewData.tracks) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-6">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-red-400 font-semibold mb-2">Preview Not Available</h3>
          <p className="text-gray-300">Unable to generate preview for this playlist.</p>
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

  const { tracks, playlist_name, total_tracks, changes_made, strategy_used, improvements } = previewData;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-spotify-light hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <h1 className="text-3xl font-bold text-white">Playlist Preview</h1>
        <div></div>
      </div>

      {/* Playlist Info */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-spotify-green to-green-400 rounded-lg flex items-center justify-center">
            <Music className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{playlist_name || 'Your Playlist'}</h2>
            <p className="text-gray-400">{total_tracks || tracks.length} tracks</p>
          </div>
        </div>

        {/* Preview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {changes_made !== undefined && (
            <div className="bg-gray-900/50 rounded-lg p-4">
              <h3 className="text-spotify-green font-semibold mb-1">Changes Made</h3>
              <p className="text-2xl font-bold text-white">{changes_made}</p>
            </div>
          )}
          {strategy_used && (
            <div className="bg-gray-900/50 rounded-lg p-4">
              <h3 className="text-spotify-green font-semibold mb-1">Strategy Used</h3>
              <p className="text-white">{strategy_used}</p>
            </div>
          )}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h3 className="text-spotify-green font-semibold mb-1">Status</h3>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-white">Ready to Apply</span>
            </div>
          </div>
        </div>

        {/* Improvements */}
        {improvements && improvements.length > 0 && (
          <div className="mt-4">
            <h3 className="text-spotify-green font-semibold mb-2">Improvements Made</h3>
            <ul className="text-gray-300 space-y-1">
              {improvements.map((improvement, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Track List */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">Preview Track Order</h3>
          <p className="text-gray-400">Here's how your playlist will look after reordering</p>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {tracks.map((track, index) => (
            <div
              key={track.track_id}
              className={`flex items-center gap-4 p-4 hover:bg-gray-700/30 transition-colors ${
                track.moved_from !== undefined && track.moved_from !== track.position
                  ? 'bg-spotify-green/10 border-l-4 border-l-spotify-green'
                  : ''
              }`}
            >
              {/* Position */}
              <div className="w-8 text-right">
                <span className="text-gray-400 text-sm">{index + 1}</span>
              </div>

              {/* Play Button */}
              <button
                onClick={() => handlePlayPreview(track)}
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
              {track.moved_from !== undefined && track.moved_from !== track.position && (
                <div className="text-right">
                  <span className="text-spotify-green text-sm font-medium">
                    Moved from #{track.moved_from}
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

              {/* Popularity */}
              {track.popularity !== undefined && (
                <div className="w-12 text-right">
                  <span className="text-gray-400 text-sm">{track.popularity}%</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8 justify-center">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-semibold transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onApplyChanges}
          className="px-8 py-3 bg-spotify-green hover:bg-spotify-green/80 text-black font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          Apply Changes
        </button>
      </div>
    </div>
  );
};

export default PlaylistPreview;
