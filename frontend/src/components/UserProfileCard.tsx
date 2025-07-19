import React, { useState, useEffect } from 'react';
import { User, Calendar, BarChart3 } from 'lucide-react';

interface UserProfile {
  id: string;
  spotify_username: string | null;
  spotify_display_name: string | null;
  email: string | null;
  spotify_profile_image: string | null;
  spotify_country: string | null;
  spotify_followers: number;
  spotify_product: string | null;
  total_reorders: number;
  created_at: string | null;
  profile_updated_at: string | null;
  preferred_reorder_style: string | null;
  favorite_styles: string[];
  user_preferences: Record<string, any>;
  analytics?: {
    total_reorders: number;
    successful_reorders: number;
    failed_reorders: number;
    success_rate: number;
    most_used_style: string | null;
    style_usage: Record<string, number>;
  };
}

interface UserUsage {
  total_reorders: number;
  can_reorder: boolean;
  message: string;
}

const UserProfileCard: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [profileResponse, usageResponse] = await Promise.all([
        fetch('/api/me/profile', { credentials: 'include' }),
        fetch('/api/me/usage', { credentials: 'include' })
      ]);

      if (profileResponse.ok && usageResponse.ok) {
        const profileData = await profileResponse.json();
        const usageData = await usageResponse.json();
        setProfile(profileData);
        setUsage(usageData);
      } else {
        setError('Failed to load user data');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!profile || !usage) {
    return null;
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-spotify-green/20 rounded-full flex items-center justify-center overflow-hidden">
            {profile.spotify_profile_image ? (
              <img 
                src={profile.spotify_profile_image} 
                alt="Profile" 
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <User className="w-5 h-5 text-spotify-green" />
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold">
              {profile.spotify_display_name || profile.spotify_username || 'Spotify User'}
            </h3>
            <div className="flex items-center gap-2 text-sm text-spotify-green">
              <User className="w-4 h-4" />
              <span>Unlimited Access</span>
              {profile.spotify_product && (
                <span className="text-gray-400">• {profile.spotify_product}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Usage Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">Status</span>
          <div className="flex items-center gap-2 text-spotify-green">
            <span>Unlimited reorders</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-700">
          <div className="text-center">
            <div className="text-white font-semibold text-lg">{usage.total_reorders}</div>
            <div className="text-gray-400 text-xs">Total Reorders</div>
          </div>
          <div className="text-center">
            <div className="text-white font-semibold text-lg">
              {profile.analytics?.success_rate ? `${profile.analytics.success_rate}%` : 'N/A'}
            </div>
            <div className="text-gray-400 text-xs">Success Rate</div>
          </div>
        </div>

        {/* Additional Profile Info */}
        {(profile.preferred_reorder_style || profile.analytics?.most_used_style) && (
          <div className="pt-3 border-t border-gray-700">
            <div className="text-gray-400 text-sm mb-2">Reordering Style</div>
            <div className="flex flex-wrap gap-2">
              {profile.preferred_reorder_style && (
                <span className="px-2 py-1 bg-spotify-green/20 text-spotify-green text-xs rounded-full">
                  Preferred: {profile.preferred_reorder_style}
                </span>
              )}
              {profile.analytics?.most_used_style && profile.analytics.most_used_style !== profile.preferred_reorder_style && (
                <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
                  Most Used: {profile.analytics.most_used_style}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Spotify Info */}
        {(profile.spotify_country || profile.spotify_followers > 0) && (
          <div className="pt-3 border-t border-gray-700">
            <div className="text-gray-400 text-sm mb-2">Spotify Info</div>
            <div className="flex items-center gap-4 text-sm">
              {profile.spotify_country && (
                <span className="text-gray-300">📍 {profile.spotify_country}</span>
              )}
              {profile.spotify_followers > 0 && (
                <span className="text-gray-300">👥 {profile.spotify_followers.toLocaleString()} followers</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileCard;
