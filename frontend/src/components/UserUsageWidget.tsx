import React, { useState, useEffect } from 'react';
import { BarChart3, Crown, Zap } from 'lucide-react';

interface UserUsage {
  subscription_tier: string;
  monthly_reorders_used: number;
  total_reorders: number;
  can_reorder: boolean;
  message: string;
  monthly_limit: number | null;
  is_premium: boolean;
}

const UserUsageWidget: React.FC = () => {
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/me/usage', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !usage) {
    return null;
  }

  const getUsagePercentage = () => {
    if (usage.subscription_tier !== 'free' || !usage.monthly_limit) return 0;
    return (usage.monthly_reorders_used / usage.monthly_limit) * 100;
  };

  const getRemainingReorders = () => {
    if (usage.subscription_tier !== 'free') return '∞';
    return Math.max(0, (usage.monthly_limit || 3) - usage.monthly_reorders_used);
  };

  const getTierColor = () => {
    switch (usage.subscription_tier) {
      case 'premium': return 'text-spotify-green';
      case 'pro': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {usage.is_premium ? (
            <Crown className="w-4 h-4 text-spotify-green" />
          ) : (
            <BarChart3 className="w-4 h-4 text-gray-400" />
          )}
          <span className={`text-sm font-medium capitalize ${getTierColor()}`}>
            {usage.subscription_tier}
          </span>
        </div>
        <a
          href="/profile"
          className="text-xs text-spotify-light hover:text-white transition-colors"
        >
          View Profile
        </a>
      </div>

      {usage.subscription_tier === 'free' && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">This Month</span>
            <span className="text-sm text-white">
              {usage.monthly_reorders_used} / {usage.monthly_limit} used
            </span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
            <div
              className="bg-spotify-green h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${getUsagePercentage()}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">
              {getRemainingReorders()} remaining
            </span>
            {usage.monthly_reorders_used >= (usage.monthly_limit || 3) && (
              <a
                href="/upgrade"
                className="text-xs text-spotify-green hover:text-spotify-light transition-colors font-medium"
              >
                Upgrade
              </a>
            )}
          </div>
        </div>
      )}

      {usage.subscription_tier !== 'free' && (
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-spotify-green">
            <Zap className="w-3 h-3" />
            <span className="text-sm font-medium">Unlimited Reorders</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {usage.total_reorders} total completed
          </div>
        </div>
      )}
    </div>
  );
};

export default UserUsageWidget;
