import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Play, Lightbulb, CheckCircle, Sparkles, Music } from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    type: 'click' | 'input' | 'wait';
    target?: string;
    value?: string;
  };
}

interface InteractiveTutorialProps {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to AI Playlist Reordering! 🎵',
    content: 'This quick tutorial will show you how to transform your playlists using AI. Your music will flow better than ever before!',
    position: 'bottom'
  },
  {
    id: 'playlist-selection',
    title: 'Step 1: Choose Your Playlist',
    content: 'First, select the playlist you want to reorder. We\'ll fetch all your Spotify playlists automatically.',
    target: '[data-tutorial="playlist-selection"]',
    position: 'bottom'
  },
  {
    id: 'user-intent',
    title: 'Step 2: Tell Us Your Goal',
    content: 'Describe what you want to achieve. For example: "Create a workout flow" or "Perfect for a dinner party". The AI uses this to understand your vision.',
    target: '[data-tutorial="user-intent"]',
    position: 'bottom'
  },
  {
    id: 'personal-tone',
    title: 'Step 3: Set Your Vibe',
    content: 'Choose the emotional tone you want. This helps the AI understand the mood and energy progression for your playlist.',
    target: '[data-tutorial="personal-tone"]',
    position: 'bottom'
  },
  {
    id: 'reorder-style',
    title: 'Step 4: Pick Your Style',
    content: 'Select how you want tracks arranged. Each style creates a different listening experience - from smooth flows to energetic buildups.',
    target: '[data-tutorial="reorder-style"]',
    position: 'bottom'
  },
  {
    id: 'async-mode',
    title: 'Pro Tip: Async Processing',
    content: 'For large playlists, enable async mode. You can continue browsing while AI works in the background, and we\'ll notify you when it\'s done!',
    target: '[data-tutorial="async-toggle"]',
    position: 'top'
  },
  {
    id: 'preview-mode',
    title: 'Step 5: Preview Before Applying',
    content: 'Always review changes first! The preview shows you exactly what will change, and you can manually fine-tune before applying.',
    position: 'bottom'
  },
  {
    id: 'completion',
    title: 'You\'re Ready to Go! 🚀',
    content: 'That\'s it! Start with a smaller playlist to test it out. Remember, you can always undo changes in Spotify if needed.',
    position: 'bottom'
  }
];

const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  isVisible,
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightTarget, setHighlightTarget] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible && tutorialSteps[currentStep]?.target) {
      setHighlightTarget(tutorialSteps[currentStep].target!);
      
      // Scroll target into view
      const element = document.querySelector(tutorialSteps[currentStep].target!);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setHighlightTarget(null);
    }
  }, [currentStep, isVisible]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  if (!isVisible) return null;

  const step = tutorialSteps[currentStep];
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40" />
      
      {/* Highlight overlay */}
      {highlightTarget && (
        <div className="fixed inset-0 z-45 pointer-events-none">
          <div className="absolute inset-0">
            <div 
              className="highlight-target"
              style={{
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.8)'
              }}
            />
          </div>
        </div>
      )}

      {/* Tutorial Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-2xl shadow-2xl max-w-lg w-full border border-white/20">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    AI Tutorial
                  </h3>
                  <p className="text-purple-200 text-sm">
                    Step {currentStep + 1} of {tutorialSteps.length}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="bg-white/10 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              {step.title}
            </h4>
            <p className="text-purple-100 leading-relaxed mb-6">
              {step.content}
            </p>

            {/* Step-specific content */}
            {step.id === 'welcome' && (
              <div className="bg-white/10 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3 text-green-400 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">What you'll learn:</span>
                </div>
                <ul className="text-purple-200 text-sm space-y-1 ml-7">
                  <li>• How to select and prepare playlists</li>
                  <li>• Setting goals and moods for AI</li>
                  <li>• Previewing and fine-tuning results</li>
                  <li>• Pro tips for best results</li>
                </ul>
              </div>
            )}

            {step.id === 'completion' && (
              <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3 text-green-400 mb-2">
                  <Music className="w-4 h-4" />
                  <span className="text-sm font-medium">Ready to get started!</span>
                </div>
                <p className="text-green-200 text-sm">
                  Start with a playlist of 10-50 songs for the best experience. 
                  Remember: you can always revert changes in Spotify.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                currentStep === 0
                  ? 'text-gray-500 cursor-not-allowed'
                  : 'text-purple-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Skip Tutorial
              </button>
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/25"
              >
                {currentStep === tutorialSteps.length - 1 ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Get Started
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom styles for highlighting */}
      <style jsx>{`
        .highlight-target::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          border: 3px solid #8b5cf6;
          border-radius: 12px;
          animation: pulse 2s infinite;
          pointer-events: none;
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.05);
            opacity: 0.7;
          }
        }
      `}</style>
    </>
  );
};

export default InteractiveTutorial;
