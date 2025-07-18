import React, { useState, useEffect } from 'react';
import { User, Crown, Calendar, BarChart3, Zap, ArrowLeft, CreditCard } from 'lucide-react';

interface UserProfile {
  id: string;
  spotify_username: string | null;
  email: string | null;
  subscription_tier: string;
  subscription_expires_at: string | null;
  monthly_reorders_used: number;
  total_reorders: number;
  created_at: string;
}

const UserProfile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/me/profile', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        setError('Failed to load profile');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'text-gray-400';
      case 'premium': return 'text-spotify-green';
      case 'pro': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'premium':
      case 'pro':
        return <Crown className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  const getRemainingReorders = () => {
    if (!profile) return 0;
    if (profile.subscription_tier !== 'free') return 'Unlimited';
    return Math.max(0, 3 - profile.monthly_reorders_used);
  };

  const getUsagePercentage = () => {
    if (!profile || profile.subscription_tier !== 'free') return 0;
    return (profile.monthly_reorders_used / 3) * 100;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-spotify-green border-t-transparent"></div>
          <span className="ml-3 text-gray-400">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={fetchProfile}
            className="px-4 py-2 bg-spotify-green hover:bg-spotify-light rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12 text-gray-400">
          No profile data available
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <a
        href="/"
        className="flex items-center gap-2 mb-6 text-spotify-light hover:text-white transition-colors"
      >
        <ArrowLeft size={20} /> Back to Dashboard
      </a>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </h2>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400">Spotify Username</label>
              <div className="text-white">{profile.spotify_username || 'Not set'}</div>
            </div>
            
            <div>
              <label className="text-sm text-gray-400">Email</label>
              <div className="text-white">{profile.email || 'Not set'}</div>
            </div>
            
            <div>
              <label className="text-sm text-gray-400">Member Since</label>
              <div className="text-white">{formatDate(profile.created_at)}</div>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            {getTierIcon(profile.subscription_tier)}
            Subscription
          </h2>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400">Current Plan</label>
              <div className={`text-lg font-semibold capitalize ${getTierColor(profile.subscription_tier)}`}>
                {profile.subscription_tier}
                {profile.subscription_tier === 'free' && (
                  <span className="ml-2 text-sm text-gray-500">($0/month)</span>
                )}
              </div>
            </div>
            
            {profile.subscription_expires_at && (
              <div>
                <label className="text-sm text-gray-400">Expires</label>
                <div className="text-white">{formatDate(profile.subscription_expires_at)}</div>
              </div>
            )}
            
            {profile.subscription_tier === 'free' && (
              <div className="mt-4">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-spotify-green hover:bg-spotify-light rounded-lg transition-colors">
                  <Crown className="w-4 h-4" />
                  Upgrade to Premium
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Usage Statistics
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Total Reorders</label>
              <div className="text-2xl font-bold text-white">{profile.total_reorders}</div>
            </div>
            
            {profile.subscription_tier === 'free' && (
              <div>
                <label className="text-sm text-gray-400">This Month</label>
                <div className="text-lg text-white mb-2">
                  {profile.monthly_reorders_used} / 3 used
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-spotify-green h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getUsagePercentage()}%` }}
                  ></div>
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {getRemainingReorders()} reorders remaining
                </div>
              </div>
            )}
            
            {profile.subscription_tier !== 'free' && (
              <div>
                <label className="text-sm text-gray-400">This Month</label>
                <div className="text-lg text-spotify-green font-semibold">
                  Unlimited ∞
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quick Actions
          </h2>
          
          <div className="space-y-3">
            <a
              href="/history"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <Calendar className="w-4 h-4" />
              View Job History
            </a>
            
            <a
              href="/settings"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <User className="w-4 h-4" />
              Account Settings
            </a>
            
            {profile.subscription_tier === 'free' && (
              <a
                href="/upgrade"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-spotify-green hover:bg-spotify-light text-black rounded-lg transition-colors font-semibold"
              >
                <CreditCard className="w-4 h-4" />
                Upgrade Account
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
