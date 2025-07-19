import React, { useState, useEffect } from 'react';
import { User, Calendar, BarChart3, Zap, ArrowLeft } from 'lucide-react';

interface UserProfile {
  id: string;
  spotify_username: string | null;
  email: string | null;
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
            
            <div>
              <label className="text-sm text-gray-400">Status</label>
              <div className="text-lg text-spotify-green font-semibold">
                Unlimited ∞
              </div>
            </div>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
