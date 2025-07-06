import React, { useState } from 'react';
import { Heart, Zap, Coffee, Sun, Moon, Music, Target, Sparkles, ArrowLeft } from 'lucide-react';

interface UserIntentProps {
  onIntentSelected: (intent: string, customGoal?: string) => void;
  onBack: () => void;
}

const presetIntents = [
  {
    id: 'energize',
    name: 'Energize Me',
    description: 'Build energy from chill to hype',
    icon: <Zap className="w-8 h-8 text-yellow-400" />,
    prompt: 'Create an energizing flow that builds momentum and gets me pumped up'
  },
  {
    id: 'relax',
    name: 'Wind Down',
    description: 'Perfect for relaxation and calm',
    icon: <Moon className="w-8 h-8 text-blue-400" />,
    prompt: 'Arrange these songs for a peaceful, relaxing experience that helps me unwind'
  },
  {
    id: 'focus',
    name: 'Focus Flow',
    description: 'Steady energy for productivity',
    icon: <Target className="w-8 h-8 text-green-400" />,
    prompt: 'Create a consistent, focused flow perfect for deep work and concentration'
  },
  {
    id: 'emotional',
    name: 'Emotional Journey',
    description: 'Take me on a feeling adventure',
    icon: <Heart className="w-8 h-8 text-pink-400" />,
    prompt: 'Craft an emotional journey with meaningful transitions and storytelling'
  },
  {
    id: 'morning',
    name: 'Morning Motivation',
    description: 'Start the day right',
    icon: <Sun className="w-8 h-8 text-orange-400" />,
    prompt: 'Perfect morning playlist that gently awakens and motivates me for the day'
  },
  {
    id: 'party',
    name: 'Party Vibes',
    description: 'Keep the energy high',
    icon: <Sparkles className="w-8 h-8 text-purple-400" />,
    prompt: 'Maintain high energy and party vibes throughout the playlist'
  }
];

const UserIntent: React.FC<UserIntentProps> = ({ onIntentSelected, onBack }) => {
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  const [customGoal, setCustomGoal] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handlePresetSelect = (intent: any) => {
    setSelectedIntent(intent.id);
    onIntentSelected(intent.prompt);
  };

  const handleCustomSubmit = () => {
    if (customGoal.trim()) {
      onIntentSelected(customGoal.trim());
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 mb-8 text-spotify-light hover:text-white transition-colors"
      >
        <ArrowLeft size={20} /> Back to Playlists
      </button>
      
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">What's your goal?</h2>
        <p className="text-gray-400 text-lg">Tell us what you want to achieve with this playlist</p>
      </div>

      {!showCustom ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {presetIntents.map((intent) => (
              <div
                key={intent.id}
                className="bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-spotify-green/50 rounded-lg p-6 cursor-pointer transition-all duration-300 group"
                onClick={() => handlePresetSelect(intent)}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                    {intent.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{intent.name}</h3>
                  <p className="text-gray-400 text-sm">{intent.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => setShowCustom(true)}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              <Music className="w-5 h-5 inline mr-2" />
              Write Custom Goal
            </button>
          </div>
        </>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Describe your custom goal</h3>
            <textarea
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="e.g., 'Create a nostalgic journey through my teenage years' or 'Make this perfect for a late-night drive'"
              className="w-full h-32 bg-gray-900 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 resize-none focus:border-spotify-green focus:outline-none"
            />
            <div className="flex gap-4 mt-4">
              <button
                onClick={handleCustomSubmit}
                disabled={!customGoal.trim()}
                className="flex-1 px-6 py-3 bg-spotify-green hover:bg-spotify-green/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold rounded-lg transition-colors"
              >
                Use This Goal
              </button>
              <button
                onClick={() => setShowCustom(false)}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
              >
                Back to Presets
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserIntent;
