import React, { useState, useEffect } from 'react';
import { User, Crown, Calendar, BarChart3, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface UserProfile {
  id: string;
  spotify_username: string | null;
  spotify_display_name: string | null;
  email: string | null;
  spotify_profile_image: string | null;
  spotify_country: string | null;
  spotify_followers: number;
  spotify_product: string | null;
  subscription_tier: string;
  subscription_expires_at: string | null;
  monthly_reorders_used: number;
  total_reorders: number;
  created_at: string | null;
  monthly_reset_date: string | null;
  profile_updated_at: string | null;
  preferred_reorder_style: string | null;
  favorite_styles: string[];
  user_preferences: Record<string, any>;
  is_premium: boolean;
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
  subscription_tier: string;
  monthly_reorders_used: number;
  total_reorders: number;
  can_reorder: boolean;
  message: string;
  monthly_limit: number | null;
  is_premium: boolean;
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

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free':
        return 'text-gray-400';
      case 'premium':
        return 'text-spotify-green';
      case 'pro':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'premium':
      case 'pro':
        return <Crown className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getUsageStatus = () => {
    if (!usage) return null;
    
    if (usage.is_premium) {
      return (
        <div className="flex items-center gap-2 text-spotify-green">
          <CheckCircle className="w-4 h-4" />
          <span>Unlimited reorders</span>
        </div>
      );
    }

    const remaining = (usage.monthly_limit || 3) - usage.monthly_reorders_used;
    const isLimitReached = remaining <= 0;

    return (
      <div className={`flex items-center gap-2 ${isLimitReached ? 'text-red-400' : 'text-yellow-400'}`}>
        {isLimitReached ? (
          <AlertCircle className="w-4 h-4" />
        ) : (
          <Clock className="w-4 h-4" />
        )}
        <span>
          {remaining > 0 ? `${remaining} reorders remaining` : 'Monthly limit reached'}
        </span>
      </div>
    );
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
            <div className={`flex items-center gap-2 text-sm ${getTierColor(profile.subscription_tier)}`}>
              {getTierIcon(profile.subscription_tier)}
              <span className="capitalize">{profile.subscription_tier} Plan</span>
              {profile.spotify_product && (
                <span className="text-gray-400">• {profile.spotify_product}</span>
              )}
            </div>
          </div>
        </div>
        
        {!usage.is_premium && (
          <button className="px-3 py-1 bg-spotify-green hover:bg-spotify-light rounded-full text-black text-sm font-semibold transition-colors">
            Upgrade
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Usage Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">Monthly Usage</span>
          {getUsageStatus()}
        </div>

        {/* Usage Progress Bar for Free Users */}
        {!usage.is_premium && usage.monthly_limit && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>{usage.monthly_reorders_used} / {usage.monthly_limit} used</span>
              <span>{Math.round((usage.monthly_reorders_used / usage.monthly_limit) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  usage.monthly_reorders_used >= usage.monthly_limit 
                    ? 'bg-red-500' 
                    : usage.monthly_reorders_used >= usage.monthly_limit * 0.8
                    ? 'bg-yellow-500'
                    : 'bg-spotify-green'
                }`}
                style={{ width: `${Math.min((usage.monthly_reorders_used / usage.monthly_limit) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        )}

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

        {/* Upgrade CTA for Free Users */}
        {!usage.is_premium && (
          <div className="mt-4 p-3 bg-spotify-green/10 border border-spotify-green/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-spotify-green" />
              <span className="text-spotify-green font-semibold text-sm">Upgrade to Premium</span>
            </div>
            <p className="text-gray-300 text-xs mb-2">
              Unlimited reorders, larger playlists, and priority processing
            </p>
            <button className="w-full px-3 py-2 bg-spotify-green hover:bg-spotify-light rounded-lg text-black text-sm font-semibold transition-colors">
              Upgrade Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileCard;
