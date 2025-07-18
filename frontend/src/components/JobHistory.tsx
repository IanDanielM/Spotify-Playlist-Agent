import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, RefreshCw, Music, Calendar, Target } from 'lucide-react';

interface Job {
  job_id: string;
  playlist_name: string;
  status: string;
  progress_percentage: number;
  total_tracks: number;
  reorder_style: string;
  created_at: string;
  completed_at?: string;
  success?: boolean;
}

const JobHistory: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    fetchJobs();
    
    // Set up auto-refresh for in-progress jobs
    const interval = setInterval(() => {
      // Only refresh if there are in-progress jobs
      setJobs(currentJobs => {
        const hasInProgressJobs = currentJobs.some(job => 
          job.status === 'in_progress' || job.status === 'pending'
        );
        
        if (hasInProgressJobs) {
          fetchJobs();
        }
        
        return currentJobs; // Return unchanged jobs
      });
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, []); // Empty dependency array to run only once

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/my-jobs', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs);
        setLastRefresh(new Date());
      } else {
        setError('Failed to load job history');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string, success?: boolean) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'in_progress':
        return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'completed':
        return success ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        );
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string, success?: boolean) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-500';
      case 'in_progress':
        return 'text-blue-500';
      case 'completed':
        return success ? 'text-green-500' : 'text-red-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStyleEmoji = (style: string) => {
    const styleMap: { [key: string]: string } = {
      'energy_flow': '⚡',
      'emotional_journey': '🎭',
      'narrative_arc': '📖',
      'tempo_progression': '🎵',
      'mood_clusters': '🌈',
      'default': '🎶'
    };
    return styleMap[style] || styleMap.default;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-spotify-green border-t-transparent"></div>
        <span className="ml-3 text-gray-400">Loading job history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Error Loading History</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchJobs}
          className="px-4 py-2 bg-spotify-green hover:bg-spotify-light rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Retry
        </button>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <Music className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Jobs Yet</h3>
        <p className="text-gray-400">Your playlist reorder history will appear here.</p>
      </div>
    );
  }

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Job History</h2>
            <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
              {lastRefresh && (
                <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
              )}
              {jobs.some(job => job.status === 'in_progress' || job.status === 'pending') && (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Auto-refreshing
                </span>
              )}
            </div>
          </div>
          <button
            onClick={fetchJobs}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>      <div className="space-y-4">
        {jobs.map((job) => (
          <div
            key={job.job_id}
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(job.status, job.success)}
                <div>
                  <h3 className="text-white font-semibold">{job.playlist_name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Music className="w-3 h-3" />
                      {job.total_tracks} tracks
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {getStyleEmoji(job.reorder_style)} {job.reorder_style.replace('_', ' ')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(job.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className={`text-sm font-medium capitalize ${getStatusColor(job.status, job.success)}`}>
                  {job.status === 'completed' && job.success === false ? 'Failed' : job.status.replace('_', ' ')}
                </div>
                {job.completed_at && (
                  <div className="text-xs text-gray-400 mt-1">
                    Completed {formatDate(job.completed_at)}
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar for in-progress jobs */}
            {job.status === 'in_progress' && (
              <div className="mt-4">
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-spotify-green h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${job.progress_percentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {job.progress_percentage}% complete
                </div>
              </div>
            )}

            {/* Success/failure details */}
            {job.status === 'completed' && (
              <div className="mt-3 text-sm">
                {job.success ? (
                  <div className="text-green-400">
                    ✅ Successfully reordered playlist
                  </div>
                ) : (
                  <div className="text-red-400">
                    ❌ Job completed but failed to apply changes
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {jobs.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Showing {jobs.length} recent jobs
          </p>
        </div>
      )}
    </div>
  );
};

export default JobHistory;
