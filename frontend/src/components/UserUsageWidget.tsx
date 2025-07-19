import React, { useState, useEffect } from 'react';
import { BarChart3, Zap } from 'lucide-react';

interface UserUsage {
  total_reorders: number;
  can_reorder: boolean;
  message: string;
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

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-spotify-green" />
          <span className="text-sm font-medium text-spotify-green">
            Usage Stats
          </span>
        </div>
        <a
          href="/profile"
          className="text-xs text-spotify-light hover:text-white transition-colors"
        >
          View Profile
        </a>
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center gap-1 text-spotify-green mb-2">
          <Zap className="w-3 h-3" />
          <span className="text-sm font-medium">Unlimited Reorders</span>
        </div>
        <div className="text-xs text-gray-400">
          {usage.total_reorders} total completed
        </div>
      </div>
    </div>
  );
};

export default UserUsageWidget;
