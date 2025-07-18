import React, { useState, useEffect } from 'react';
import { Star, Settings, Plus, X, Check } from 'lucide-react';

interface StylePreferences {
  preferred_style: string | null;
  favorite_styles: string[];
  user_preferences: Record<string, any>;
}

const availableStyles = [
  'energy',
  'genre',
  'chronological',
  'mood',
  'tempo',
  'artist',
  'popularity',
  'danceability',
  'valence',
  'era',
  'release_date',
  'similarity',
  'custom'
];

const UserPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<StylePreferences>({
    preferred_style: null,
    favorite_styles: [],
    user_preferences: {}
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/me/profile', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setPreferences({
          preferred_style: data.preferred_reorder_style,
          favorite_styles: data.favorite_styles || [],
          user_preferences: data.user_preferences || {}
        });
      } else {
        setError('Failed to load preferences');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const setPreferredStyle = async (style: string) => {
    try {
      setSaving(true);
      const response = await fetch('/api/me/preferred-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ style })
      });

      if (response.ok) {
        setPreferences(prev => ({ ...prev, preferred_style: style }));
        setSuccessMessage('Preferred style updated successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('Failed to update preferred style');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setSaving(false);
    }
  };

  const toggleFavoriteStyle = async (style: string) => {
    try {
      setSaving(true);
      const isFavorite = preferences.favorite_styles.includes(style);
      const endpoint = isFavorite ? '/api/me/favorite-styles' : '/api/me/favorite-styles';
      const method = isFavorite ? 'DELETE' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ style })
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(prev => ({
          ...prev,
          favorite_styles: data.favorite_styles
        }));
        setSuccessMessage(isFavorite ? 'Removed from favorites' : 'Added to favorites');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('Failed to update favorite styles');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setSaving(false);
    }
  };

  const updateGeneralPreferences = async (newPrefs: Record<string, any>) => {
    try {
      setSaving(true);
      const response = await fetch('/api/me/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ preferences: newPrefs })
      });

      if (response.ok) {
        setPreferences(prev => ({
          ...prev,
          user_preferences: { ...prev.user_preferences, ...newPrefs }
        }));
        setSuccessMessage('Preferences updated successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('Failed to update preferences');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setSaving(false);
    }
  };

  const getStyleColor = (style: string, index: number) => {
    const colors = [
      'bg-spotify-green/20 text-spotify-green border-spotify-green/30',
      'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'bg-red-500/20 text-red-400 border-red-500/30',
      'bg-pink-500/20 text-pink-400 border-pink-500/30',
      'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    ];
    return colors[index % colors.length];
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Preferences & Styles</h2>
        {successMessage && (
          <div className="flex items-center gap-2 text-spotify-green text-sm">
            <Check className="w-4 h-4" />
            {successMessage}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Preferred Style */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Preferred Reordering Style</h3>
        </div>
        
        <p className="text-gray-400 text-sm mb-4">
          Set your default reordering style to speed up your workflow
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {availableStyles.map((style, index) => (
            <button
              key={style}
              onClick={() => setPreferredStyle(style)}
              disabled={saving}
              className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                preferences.preferred_style === style
                  ? 'bg-spotify-green/20 text-spotify-green border-spotify-green/50'
                  : 'bg-gray-700/50 text-gray-300 border-gray-600/50 hover:bg-gray-600/50'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {preferences.preferred_style === style && (
                <Check className="w-4 h-4 inline mr-2" />
              )}
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* Favorite Styles */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Favorite Styles</h3>
        </div>
        
        <p className="text-gray-400 text-sm mb-4">
          Mark your favorite reordering styles for quick access
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {availableStyles.map((style, index) => {
            const isFavorite = preferences.favorite_styles.includes(style);
            return (
              <button
                key={style}
                onClick={() => toggleFavoriteStyle(style)}
                disabled={saving}
                className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                  isFavorite
                    ? getStyleColor(style, index)
                    : 'bg-gray-700/50 text-gray-300 border-gray-600/50 hover:bg-gray-600/50'
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isFavorite ? (
                  <X className="w-4 h-4 inline mr-2" />
                ) : (
                  <Plus className="w-4 h-4 inline mr-2" />
                )}
                {style}
              </button>
            );
          })}
        </div>
        
        {preferences.favorite_styles.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-sm font-medium text-gray-300 mb-2">
              Your Favorites ({preferences.favorite_styles.length}):
            </h4>
            <div className="flex flex-wrap gap-2">
              {preferences.favorite_styles.map((style, index) => (
                <span key={style} className={`px-2 py-1 rounded-full text-xs ${getStyleColor(style, index)}`}>
                  {style}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* General Preferences */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">General Preferences</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-300">Auto-apply preferred style</label>
              <p className="text-xs text-gray-400">Automatically use your preferred style for new reorders</p>
            </div>
            <button
              onClick={() => updateGeneralPreferences({ 
                auto_apply_preferred: !preferences.user_preferences.auto_apply_preferred 
              })}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.user_preferences.auto_apply_preferred 
                  ? 'bg-spotify-green' 
                  : 'bg-gray-600'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.user_preferences.auto_apply_preferred ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-300">Show detailed analytics</label>
              <p className="text-xs text-gray-400">Display comprehensive analytics on your dashboard</p>
            </div>
            <button
              onClick={() => updateGeneralPreferences({ 
                show_detailed_analytics: !preferences.user_preferences.show_detailed_analytics 
              })}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.user_preferences.show_detailed_analytics !== false 
                  ? 'bg-spotify-green' 
                  : 'bg-gray-600'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.user_preferences.show_detailed_analytics !== false ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPreferences;
