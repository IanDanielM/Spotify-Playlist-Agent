import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Star, Calendar, RefreshCw } from 'lucide-react';

interface Analytics {
  total_reorders: number;
  successful_reorders: number;
  failed_reorders: number;
  success_rate: number;
  most_used_style: string | null;
  style_usage: Record<string, number>;
  recent_activity_count: number;
  monthly_trends: Record<string, {
    total: number;
    successful: number;
    failed: number;
    styles: Record<string, number>;
  }>;
  favorite_styles: string[];
  preferred_style: string | null;
  total_tracks_reordered: number;
  average_tracks_per_playlist: number;
}

interface Recommendations {
  recommended_styles: string[];
  tips: string[];
  insights: string[];
}

const UserAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
    fetchRecommendations();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/me/analytics', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        setError('Failed to load analytics');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/me/recommendations', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    }
  };

  const refreshSpotifyProfile = async () => {
    try {
      const response = await fetch('/api/me/refresh-spotify-profile', { 
        method: 'POST',
        credentials: 'include' 
      });
      if (response.ok) {
        // Refresh the page data
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
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

  if (!analytics) {
    return null;
  }

  const getStyleColor = (style: string, index: number) => {
    const colors = [
      'bg-spotify-green/20 text-spotify-green',
      'bg-blue-500/20 text-blue-400',
      'bg-purple-500/20 text-purple-400',
      'bg-yellow-500/20 text-yellow-400',
      'bg-red-500/20 text-red-400',
      'bg-pink-500/20 text-pink-400',
      'bg-indigo-500/20 text-indigo-400',
    ];
    return colors[index % colors.length];
  };

  const sortedStyles = Object.entries(analytics.style_usage)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const recentMonths = Object.entries(analytics.monthly_trends)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Analytics & Insights</h2>
        <button
          onClick={refreshSpotifyProfile}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Profile
        </button>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 text-spotify-green mb-2">
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm font-medium">Success Rate</span>
          </div>
          <div className="text-2xl font-bold text-white">{analytics.success_rate}%</div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Total Tracks</span>
          </div>
          <div className="text-2xl font-bold text-white">{analytics.total_tracks_reordered.toLocaleString()}</div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Avg. Playlist</span>
          </div>
          <div className="text-2xl font-bold text-white">{analytics.average_tracks_per_playlist} tracks</div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 text-yellow-400 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">Recent Activity</span>
          </div>
          <div className="text-2xl font-bold text-white">{analytics.recent_activity_count}</div>
        </div>
      </div>

      {/* Style Usage */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Style Usage</h3>
        <div className="space-y-3">
          {sortedStyles.map(([style, count], index) => (
            <div key={style} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-xs ${getStyleColor(style, index)}`}>
                  {style}
                </span>
                {analytics.preferred_style === style && (
                  <Star className="w-4 h-4 text-yellow-400" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-300 text-sm">{count} times</span>
                <div className="w-16 bg-gray-700 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-spotify-green transition-all duration-300"
                    style={{ width: `${(count / analytics.total_reorders) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trends */}
      {recentMonths.length > 0 && (
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Monthly Activity</h3>
          <div className="space-y-3">
            {recentMonths.map(([month, data]) => (
              <div key={month} className="flex items-center justify-between">
                <div>
                  <span className="text-white font-medium">{month}</span>
                  <div className="text-sm text-gray-400">
                    {data.total} reorders • {Math.round((data.successful / data.total) * 100)}% success
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-spotify-green font-semibold">{data.successful}</div>
                  <div className="text-red-400 text-sm">{data.failed} failed</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && (
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Personalized Recommendations</h3>
          
          {recommendations.recommended_styles.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Recommended Styles to Try:</h4>
              <div className="flex flex-wrap gap-2">
                {recommendations.recommended_styles.map((style, index) => (
                  <span key={style} className={`px-2 py-1 rounded-full text-xs ${getStyleColor(style, index)}`}>
                    {style}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {recommendations.tips.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Tips for Better Results:</h4>
              <ul className="space-y-1">
                {recommendations.tips.map((tip, index) => (
                  <li key={index} className="text-sm text-gray-400 flex items-start gap-2">
                    <span className="text-spotify-green">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {recommendations.insights.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Insights:</h4>
              <ul className="space-y-1">
                {recommendations.insights.map((insight, index) => (
                  <li key={index} className="text-sm text-gray-400 flex items-start gap-2">
                    <span className="text-blue-400">💡</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserAnalytics;
