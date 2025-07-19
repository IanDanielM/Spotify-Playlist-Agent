import React, { useState, useEffect } from 'react';
import PlaylistSelection from './PlaylistSelection';
import PlaylistPreview from './PlaylistPreview';
import PlaylistPreviewModal from './PlaylistPreviewModal';
import UserIntent from './UserIntent';
import PersonalTone from './PersonalTone';
import ReorderStyle from './ReorderStyle';
import ReorderStrategy from './ReorderStrategy';
import JobHistory from './JobHistory';
import UserProfileCard from './UserProfileCard';
import InteractiveTutorial from './InteractiveTutorial';
import RealTimePlaylistReorder from './RealTimePlaylistReorder';
import SamplePlaylistDemo from './SamplePlaylistDemo';
import SocialSharing from './SocialSharing';
import { Music, Share2, ArrowLeft, History, CheckCircle, XCircle, HelpCircle, ExternalLink } from 'lucide-react';

type Step = 'playlist' | 'intent' | 'tone' | 'style' | 'strategy' | 'reordering' | 'success' | 'error' | 'history' | 'tutorial' | 'preview' | 'manual-reorder';

interface JobStatus {
  job_id: string;
  status: string;
  progress_percentage: number;
  total_tracks: number;
  processed_tracks: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  playlist_name?: string;
  success?: boolean;
  tracks_reordered?: number;
  strategy_info?: string;
  error_message?: string;
}

const Dashboard: React.FC = () => {
  const [step, setStep] = useState<Step>('playlist');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [userIntent, setUserIntent] = useState<string | null>(null);
  const [personalTone, setPersonalTone] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [reorderMethod, setReorderMethod] = useState<string>('auto');
  const [currentJob, setCurrentJob] = useState<JobStatus | null>(null);
  const [useAsyncMode, setUseAsyncMode] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [previewPlaylistId, setPreviewPlaylistId] = useState<string | null>(null);
  const [previewPlaylistName, setPreviewPlaylistName] = useState<string | null>(null);
  const [showSampleDemo, setShowSampleDemo] = useState(false);
  const [showSocialSharing, setShowSocialSharing] = useState(false);
  const [successPlaylistData, setSuccessPlaylistData] = useState<any>(null);

  const handlePlaylistSelected = (playlistId: string) => {
    setSelectedPlaylist(playlistId);
    setStep('intent');
  };

  const handlePreviewPlaylist = async (playlistId: string) => {
    // Show quick preview modal
    setPreviewPlaylistId(playlistId);
    setShowPreviewModal(true);
    
    // Optionally get playlist name
    try {
      const response = await fetch('/api/spotify/playlists', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        const playlist = data.playlists?.find((p: any) => p.id === playlistId);
        if (playlist) {
          setPreviewPlaylistName(playlist.name);
        }
      }
    } catch (error) {
      console.error('Error fetching playlist name:', error);
    }
  };

  const handleManualReorder = (playlistId: string) => {
    // Set the playlist and go directly to manual reorder - no AI processing needed
    setSelectedPlaylist(playlistId);
    setStep('manual-reorder');
  };

  const handleEditFromPreview = () => {
    // Called when user clicks "Edit & Reorder" from modal
    if (previewPlaylistId) {
      setSelectedPlaylist(previewPlaylistId);
      setStep('manual-reorder');
      setShowPreviewModal(false);
    }
  };

  const handleIntentSelected = (intent: string) => {
    setUserIntent(intent);
    setStep('tone');
  };

  const handleToneSelected = (tone: string | null, intent: string) => {
    setPersonalTone(tone);
    setUserIntent(intent);
    setStep('style');
  };

  const handleStyleSelected = (style: string) => {
    setSelectedStyle(style);
    setStep('strategy');
  };

  const handleStrategySelected = (method: string) => {
    setReorderMethod(method);
    handleReorder();
  };

  const handleReorder = async () => {
    if (!selectedPlaylist || !userIntent || !selectedStyle) return;

    setStep('reordering');
    setErrorMessage(null);

    try {
      const endpoint = useAsyncMode ? '/api/reorder-playlist-async' : '/api/reorder-playlist';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playlist_id: selectedPlaylist,
          reorder_style: selectedStyle,
          user_intent: userIntent,
          personal_tone: personalTone,
          reorder_method: reorderMethod,
          async_processing: useAsyncMode,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        if (useAsyncMode) {
          // For async mode, redirect to job history to track progress
          setCurrentJob({
            job_id: data.job_id,
            status: 'pending',
            progress_percentage: 0,
            total_tracks: data.total_tracks,
            processed_tracks: 0,
            created_at: new Date().toISOString(),
            playlist_name: data.playlist_name || 'Current Playlist'
          });
          // Redirect to history to show the job
          setStep('history');
        } else {
          // For sync mode, capture the success data
          setCurrentJob({
            job_id: data.job_id || 'sync',
            status: 'completed',
            progress_percentage: 100,
            total_tracks: data.total_tracks || 0,
            processed_tracks: data.total_tracks || 0,
            tracks_reordered: data.tracks_reordered || 0,
            created_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            playlist_name: data.playlist_name || 'Current Playlist',
            strategy_info: data.strategy_info || `${selectedStyle} reorder`
          });
          setStep('success');
        }
      } else {
        setErrorMessage(data.detail || 'Failed to reorder playlist');
        setStep('error');
      }
    } catch (error) {
      console.error('Error reordering playlist:', error);
      setErrorMessage('Network error occurred');
      setStep('error');
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const maxAttempts = 120; // Poll for up to 10 minutes (5-second intervals)
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/job-status/${jobId}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const jobStatus: JobStatus = await response.json();
          setCurrentJob(jobStatus);

          if (jobStatus.status === 'completed') {
            if (jobStatus.success) {
              setStep('success');
            } else {
              setErrorMessage(jobStatus.error_message || 'Job completed but failed');
              setStep('error');
            }
            return;
          } else if (jobStatus.status === 'failed') {
            setErrorMessage(jobStatus.error_message || 'Job failed');
            setStep('error');
            return;
          }

          // Continue polling if job is still in progress
          if (jobStatus.status === 'pending' || jobStatus.status === 'in_progress') {
            attempts++;
            if (attempts < maxAttempts) {
              setTimeout(poll, 5000); // Poll every 5 seconds
            } else {
              setErrorMessage('Job polling timed out');
              setStep('error');
            }
          }
        } else {
          console.error('Failed to fetch job status');
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 5000);
          } else {
            setErrorMessage('Failed to track job progress');
            setStep('error');
          }
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        } else {
          setErrorMessage('Network error while tracking job');
          setStep('error');
        }
      }
    };

    poll();
  };

  const handleBack = () => {
    if (step === 'intent') {
      setStep('playlist');
    } else if (step === 'tone') {
      setStep('intent');
    } else if (step === 'style') {
      setStep('tone');
    } else if (step === 'strategy') {
      setStep('style');
    }
  };
  
  const handleReset = () => {
    setStep('playlist');
    setSelectedPlaylist(null);
    setUserIntent(null);
    setPersonalTone(null);
    setSelectedStyle(null);
    setReorderMethod('auto');
    setCurrentJob(null);
    setErrorMessage(null);
  };

  const handleShowHistory = () => {
    setStep('history');
  };

  const handleShowTutorial = () => {
    setShowTutorial(true);
  };

  const fetchPreviewData = async (playlistId: string) => {
    setPreviewLoading(true);
    try {
      const response = await fetch(`/api/preview-reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          playlist_id: playlistId,
          reorder_style: 'flow_based', // Default style for preview
          user_intent: 'Get a preview of this playlist',
          personal_tone: 'neutral'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
      } else {
        setErrorMessage('Failed to generate preview');
      }
    } catch (error) {
      console.error('Error fetching preview:', error);
      setErrorMessage('Error generating preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const renderCurrentStep = () => {
    switch (step) {
      case 'playlist':
        return (
          <div data-tutorial="playlist-selection">
            <PlaylistSelection 
              onPlaylistSelected={handlePlaylistSelected}
              onPreviewPlaylist={handlePreviewPlaylist}
              onManualReorder={handleManualReorder}
            />
          </div>
        );
      
      case 'intent':
        return (
          <div data-tutorial="user-intent">
            <button onClick={handleBack} className="flex items-center gap-2 mb-8 text-spotify-light hover:text-white transition-colors">
              <ArrowLeft size={20} />
              Back to Playlists
            </button>
            <UserIntent 
              onIntentSelected={handleIntentSelected} 
              onBack={handleBack}
            />
          </div>
        );
      
      case 'tone':
        return (
          <div data-tutorial="personal-tone">
            <button onClick={handleBack} className="flex items-center gap-2 mb-8 text-spotify-light hover:text-white transition-colors">
              <ArrowLeft size={20} />
              Back to Intent
            </button>
            <PersonalTone
              userIntent={userIntent || ''}
              onToneSelected={handleToneSelected}
              onBack={handleBack}
            />
          </div>
        );
      
      case 'style':
        return (
          <div data-tutorial="reorder-style">
            <button onClick={handleBack} className="flex items-center gap-2 mb-8 text-spotify-light hover:text-white transition-colors">
              <ArrowLeft size={20} />
              Back to Tone
            </button>
            <ReorderStyle onStyleSelected={handleStyleSelected} />
          </div>
        );
      
      case 'strategy':
        return (
          <div>
            <button onClick={handleBack} className="flex items-center gap-2 mb-8 text-spotify-light hover:text-white transition-colors">
              <ArrowLeft size={20} />
              Back to Style
            </button>
            <ReorderStrategy 
              onStrategySelected={handleStrategySelected}
            />
          </div>
        );
      
      case 'reordering':
        return (
          <div className="min-h-[400px] flex flex-col items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-spotify-green border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-white mb-4">Reordering Your Playlist</h2>
              
              {useAsyncMode && currentJob ? (
                <div className="space-y-4 max-w-md">
                  <p className="text-spotify-light">
                    Processing {currentJob.total_tracks} tracks using AI...
                  </p>
                  
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-spotify-green to-green-400 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${currentJob.progress_percentage}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>{currentJob.processed_tracks} processed</span>
                    <span>{currentJob.progress_percentage}% complete</span>
                  </div>
                  
                  <div className="flex justify-center gap-2 mt-4">
                    <button
                      onClick={() => currentJob && pollJobStatus(currentJob.job_id)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                      title="Refresh progress"
                    >
                      🔄 Refresh
                    </button>
                    <button
                      onClick={() => setStep('history')}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                    >
                      View History
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Job ID: {currentJob.job_id}
                  </p>
                </div>
              ) : (
                <p className="text-spotify-light">
                  Our AI is analyzing and reordering your tracks...
                </p>
              )}
            </div>
          </div>
        );
      
      case 'success':
        return (
          <div className="min-h-[400px] flex flex-col items-center justify-center text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">Playlist Reordered Successfully!</h2>
            
            {currentJob && (
              <div className="bg-gray-800/50 rounded-lg p-6 mb-6 max-w-md">
                <h3 className="text-lg font-semibold text-white mb-3">Reorder Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Playlist:</span>
                    <span className="text-white">{currentJob.playlist_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total tracks:</span>
                    <span className="text-white">{currentJob.total_tracks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tracks reordered:</span>
                    <span className="text-white">{currentJob.tracks_reordered || 'N/A'}</span>
                  </div>
                  {currentJob.strategy_info && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Strategy:</span>
                      <span className="text-white">
                        {(() => {
                          try {
                            const strategyData = JSON.parse(currentJob.strategy_info);
                            return strategyData.method || strategyData.strategy || currentJob.strategy_info;
                          } catch (e) {
                            return currentJob.strategy_info;
                          }
                        })()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex gap-4 flex-wrap justify-center">
              {selectedPlaylist && (
                <button 
                  onClick={() => window.open(`https://open.spotify.com/playlist/${selectedPlaylist}`, '_blank')}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full transition-all duration-300 flex items-center gap-2"
                >
                  <ExternalLink size={18} />
                  View in Spotify
                </button>
              )}
              <button onClick={() => window.location.reload()} className="px-6 py-3 bg-spotify-green hover:bg-spotify-light text-black font-semibold rounded-full transition-all duration-300">
                Reorder Another Playlist
              </button>
              <button onClick={handleShowHistory} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-semibold transition-all duration-300">
                View History
              </button>
              <button 
                onClick={() => {
                  if (currentJob) {
                    // Parse strategy_info if it's a JSON string
                    let strategyUsed = 'AI Reorder';
                    if (currentJob.strategy_info) {
                      try {
                        const strategyData = JSON.parse(currentJob.strategy_info);
                        strategyUsed = strategyData.method || strategyData.strategy || 'AI Reorder';
                      } catch (e) {
                        strategyUsed = currentJob.strategy_info;
                      }
                    }
                    
                    setSuccessPlaylistData({
                      id: selectedPlaylist || currentJob.job_id,
                      name: currentJob.playlist_name || 'Reordered Playlist',
                      total_tracks: currentJob.total_tracks,
                      tracks_reordered: currentJob.tracks_reordered || 0,
                      strategy_used: strategyUsed,
                      improvements: {
                        tracks_moved: currentJob.tracks_reordered || 0,
                        avg_popularity_change: 0,
                        genre_distribution_change: 0
                      },
                      spotify_url: selectedPlaylist ? `https://open.spotify.com/playlist/${selectedPlaylist}` : undefined
                    });
                    setShowSocialSharing(true);
                  }
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-all duration-300 flex items-center gap-2"
              >
                <Share2 size={18} />
                Share Results
              </button>
            </div>
          </div>
        );
      
      case 'error':
        return (
          <div className="min-h-[400px] flex flex-col items-center justify-center text-center">
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">Oops! Something went wrong</h2>
            <p className="text-red-400 mb-6 max-w-md">
              {errorMessage || 'An unexpected error occurred while reordering your playlist.'}
            </p>
            <div className="flex gap-4">
              <button onClick={() => window.location.reload()} className="px-6 py-3 bg-spotify-green hover:bg-spotify-light text-black font-semibold rounded-full transition-all duration-300">
                Try Again
              </button>
              <button onClick={handleShowHistory} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-semibold transition-all duration-300">
                View History
              </button>
            </div>
          </div>
        );
      
      case 'history':
        return (
          <div>
            <button onClick={() => setStep('playlist')} className="flex items-center gap-2 mb-8 text-spotify-light hover:text-white transition-colors">
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
            <JobHistory />
          </div>
        );
      
      case 'preview':
        if (previewLoading) {
          return (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-spotify-green/20 border-t-spotify-green mx-auto mb-4"></div>
              <p className="text-gray-400">Generating preview...</p>
            </div>
          );
        }

        if (!previewData) {
          return (
            <div className="text-center py-12">
              <p className="text-red-400">Failed to load preview data</p>
              <button 
                onClick={() => setStep('playlist')}
                className="mt-4 px-4 py-2 bg-spotify-green text-black rounded-lg"
              >
                Back to Playlists
              </button>
            </div>
          );
        }

        return (
          <PlaylistPreview 
            previewData={previewData}
            onApplyChanges={() => {
              // Handle applying changes - this could trigger the actual reorder
              console.log('Applying changes from preview');
              setStep('reordering');
            }}
            onBack={() => setStep('playlist')}
            loading={false}
          />
        );
      
      case 'manual-reorder':
        return (
          <RealTimePlaylistReorder 
            playlistId={selectedPlaylist!}
            onBack={() => setStep('playlist')}
            onSaveComplete={() => {
              setStep('success');
            }}
          />
        );

      default:
        return (
          <div data-tutorial="playlist-selection">
            <PlaylistSelection 
              onPlaylistSelected={handlePlaylistSelected}
              onPreviewPlaylist={handlePreviewPlaylist}
              onManualReorder={handleManualReorder}
              onTryDemo={() => setShowSampleDemo(true)}
            />
          </div>
        );
    }
  };

  return (
    <>
      {/* Interactive Tutorial */}
      {showTutorial && (
        <InteractiveTutorial
          isVisible={showTutorial}
          onComplete={() => setShowTutorial(false)}
          onSkip={() => setShowTutorial(false)}
        />
      )}

      <div className="w-full max-w-5xl mx-auto px-4 py-8">
        {/* Header with settings and history */}
        {step === 'playlist' && (
          <div className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <Music className="w-8 h-8 text-spotify-green" />
                <h1 className="text-2xl font-bold text-white">AI Playlist Reorder</h1>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTutorial(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  title="Show tutorial"
                >
                  <HelpCircle className="w-5 h-5" />
                  Tutorial
                </button>
                <button
                  onClick={handleShowHistory}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <History className="w-5 h-5" />
                  History
                </button>
              </div>
            </div>

            {/* Async Mode Toggle */}
            <div className="mb-6">
              <div 
                className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                data-tutorial="async-toggle"
              >
                <input
                  type="checkbox"
                  id="asyncMode"
                  checked={useAsyncMode}
                  onChange={(e) => setUseAsyncMode(e.target.checked)}
                  className="w-4 h-4 text-spotify-green bg-gray-100 border-gray-300 rounded focus:ring-spotify-green focus:ring-2"
                />
                <label htmlFor="asyncMode" className="text-white text-sm">
                  Enable async processing (recommended for large playlists)
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {renderCurrentStep()}
      </div>

      {/* Preview Modal */}
      <PlaylistPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        playlistId={previewPlaylistId || ''}
        playlistName={previewPlaylistName || undefined}
        onEditPlaylist={handleEditFromPreview}
      />

      {/* Sample Demo Modal */}
      {showSampleDemo && (
        <SamplePlaylistDemo
          onClose={() => setShowSampleDemo(false)}
          onSignUpPrompt={() => {
            setShowSampleDemo(false);
            window.location.href = '/auth/login';
          }}
        />
      )}

      {/* Social Sharing Modal */}
      {showSocialSharing && successPlaylistData && (
        <SocialSharing
          playlistData={successPlaylistData}
          onClose={() => setShowSocialSharing(false)}
        />
      )}
    </>
  );
};

export default Dashboard;