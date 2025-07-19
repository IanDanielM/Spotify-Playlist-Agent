import React, { useState } from 'react';
import { Share2, Twitter, Facebook, Link, Download, Copy, CheckCircle, ExternalLink } from 'lucide-react';

interface SocialSharingProps {
  playlistData: {
    id: string;
    name: string;
    description?: string;
    total_tracks: number;
    tracks_reordered?: number;
    strategy_used: string;
    improvements?: {
      tracks_moved: number;
      avg_popularity_change: number;
      genre_distribution_change: number;
    };
    spotify_url?: string;
  };
  onClose: () => void;
}

const SocialSharing: React.FC<SocialSharingProps> = ({ playlistData, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [shareFormat, setShareFormat] = useState<'simple' | 'detailed'>('simple');

  const shareUrl = window.location.origin + `/shared-playlist/${playlistData.id}`;
  
  const shareTexts = {
    simple: `🎵 Just reordered my "${playlistData.name}" playlist using AI! Check out the improved flow: ${shareUrl}`,
    detailed: `🎵 Transformed my "${playlistData.name}" playlist with AI magic!\n\n✨ ${playlistData.tracks_reordered || 0} tracks reordered\n🔄 ${playlistData.improvements?.tracks_moved || 0} tracks moved for better flow\n📈 ${playlistData.strategy_used} strategy applied\n\nCheck it out: ${shareUrl}`
  };

  const currentShareText = shareTexts[shareFormat];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(currentShareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(currentShareText)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(currentShareText)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const generateImageShare = () => {
    // This would generate a shareable image with playlist stats
    // For now, we'll create a simple HTML canvas representation
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    canvas.width = 800;
    canvas.height = 600;
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#1db954');
    gradient.addColorStop(1, '#191414');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);
    
    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('AI Playlist Reorder', 400, 80);
    
    // Playlist name
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`"${playlistData.name}"`, 400, 140);
    
    // Stats
    ctx.font = '24px Arial';
    ctx.fillText(`${playlistData.tracks_reordered || 0} tracks reordered`, 400, 200);
    ctx.fillText(`${playlistData.improvements?.tracks_moved || 0} tracks moved`, 400, 240);
    ctx.fillText(`Strategy: ${playlistData.strategy_used}`, 400, 280);
    
    // Footer
    ctx.font = '20px Arial';
    ctx.fillText('Reordered with AI • spotifyreorder.app', 400, 520);
    
    // Download the image
    const link = document.createElement('a');
    link.download = `${playlistData.name}-reordered.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Share2 size={24} />
              Share Your Reordered Playlist
            </h2>
            <p className="text-gray-400 mt-1">
              Show off your perfectly curated playlist flow
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        {/* Playlist Preview */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-spotify-green to-green-600 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-lg">
                {playlistData.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{playlistData.name}</h3>
              <p className="text-gray-400">{playlistData.total_tracks} tracks • {playlistData.strategy_used}</p>
              {playlistData.improvements && (
                <p className="text-spotify-green text-sm">
                  {playlistData.improvements.tracks_moved} tracks moved for better flow
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Share Format Toggle */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-300 mb-2 block">Share Style</label>
          <div className="flex gap-2">
            <button
              onClick={() => setShareFormat('simple')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                shareFormat === 'simple' 
                ? 'bg-spotify-green text-black' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Simple
            </button>
            <button
              onClick={() => setShareFormat('detailed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                shareFormat === 'detailed' 
                ? 'bg-spotify-green text-black' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Detailed
            </button>
          </div>
        </div>

        {/* Share Text Preview */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-300 mb-2 block">Share Text</label>
          <div className="bg-gray-800 rounded-lg p-4 relative">
            <p className="text-white text-sm whitespace-pre-line">{currentShareText}</p>
            <button
              onClick={handleCopyText}
              className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white transition-colors"
              title="Copy text"
            >
              {copied ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Social Media Buttons */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={shareToTwitter}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              <Twitter size={20} />
              Share on Twitter
            </button>
            
            <button
              onClick={shareToFacebook}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Facebook size={20} />
              Share on Facebook
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              {copied ? <CheckCircle size={20} className="text-green-400" /> : <Link size={20} />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            
            <button
              onClick={generateImageShare}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              <Download size={20} />
              Download Image
            </button>
          </div>

          {/* Spotify Link */}
          {playlistData.spotify_url && (
            <button
              onClick={() => window.open(playlistData.spotify_url, '_blank')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-spotify-green hover:bg-green-400 text-black rounded-lg font-medium transition-colors"
            >
              <ExternalLink size={20} />
              View in Spotify
            </button>
          )}
        </div>

        {/* Share Link */}
        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <label className="text-sm font-medium text-gray-300 mb-2 block">Direct Link</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-spotify-green focus:outline-none text-sm"
            />
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 bg-spotify-green text-black rounded hover:bg-green-400 transition-colors"
              title="Copy link"
            >
              {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-xs">
            Share your AI-optimized playlist and inspire others to improve their music flow
          </p>
        </div>
      </div>
    </div>
  );
};

export default SocialSharing;
