import React, { useState, useEffect } from 'react';
import { User, Edit3, Save, Sparkles, ArrowLeft } from 'lucide-react';

interface PersonalToneProps {
  userIntent: string;
  onToneSelected: (tone: string | null, intent: string) => void;
  onBack: () => void;
}

const presetTones = [
  {
    id: 'smooth_transitions',
    name: 'Smooth Operator',
    description: 'I love seamless transitions and flowing progressions',
    tone: 'My personal style: I prefer smooth, seamless transitions between songs and flowing musical progressions that feel natural.'
  },
  {
    id: 'eclectic_mix',
    name: 'Eclectic Explorer',
    description: 'I enjoy surprising combinations and genre mixing',
    tone: 'My personal style: I love eclectic mixes, surprising genre combinations, and playlists that keep me guessing.'
  },
  {
    id: 'emotional_depth',
    name: 'Emotion Seeker',
    description: 'I want deep emotional connections and meaningful flows',
    tone: 'My personal style: I value emotional depth, meaningful lyrics, and playlists that tell profound stories.'
  },
  {
    id: 'high_energy',
    name: 'Energy Enthusiast',
    description: 'I prefer upbeat, energetic, and motivating music',
    tone: 'My personal style: I gravitate toward high-energy, upbeat music that motivates and energizes me.'
  },
  {
    id: 'indie_focus',
    name: 'Indie Aficionado',
    description: 'I have a preference for indie and alternative sounds',
    tone: 'My personal style: I have a strong preference for indie, alternative, and underground music with unique sounds.'
  }
];

const PersonalTone: React.FC<PersonalToneProps> = ({ userIntent, onToneSelected, onBack }) => {
  const [savedTone, setSavedTone] = useState<string | null>(null);
  const [customTone, setCustomTone] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  useEffect(() => {
    // Load saved tone from localStorage
    const saved = localStorage.getItem('user_personal_tone');
    if (saved) {
      setSavedTone(saved);
    }
  }, []);

  const handleSaveCustomTone = () => {
    if (customTone.trim()) {
      const toneText = customTone.trim();
      setSavedTone(toneText);
      localStorage.setItem('user_personal_tone', toneText);
      setIsEditing(false);
      setCustomTone('');
    }
  };

  const handleUsePresetTone = (preset: any) => {
    setSelectedPreset(preset.id);
    setSavedTone(preset.tone);
    localStorage.setItem('user_personal_tone', preset.tone);
  };

  const handleContinue = () => {
    onToneSelected(savedTone, userIntent);
  };

  const handleSkip = () => {
    onToneSelected(null, userIntent);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 mb-8 text-spotify-light hover:text-white transition-colors"
      >
        <ArrowLeft size={20} /> Back to Goal
      </button>
      
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">Your Personal Style</h2>
        <p className="text-gray-400 text-lg">Add your personal touch to make it uniquely yours</p>
      </div>

      {/* Show current goal */}
      <div className="bg-spotify-green/10 border border-spotify-green/30 rounded-lg p-4 mb-8">
        <h3 className="text-spotify-green font-semibold mb-2">Your Goal:</h3>
        <p className="text-gray-300">{userIntent}</p>
      </div>

      {/* Current saved tone */}
      {savedTone && !isEditing && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Your Personal Style
            </h3>
            <button
              onClick={() => setIsEditing(true)}
              className="text-spotify-green hover:text-spotify-green/80 transition-colors"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-300 leading-relaxed">{savedTone}</p>
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleContinue}
              className="flex-1 px-6 py-3 bg-spotify-green hover:bg-spotify-green/80 text-black font-semibold rounded-lg transition-colors"
            >
              <Sparkles className="w-5 h-5 inline mr-2" />
              Use My Style
            </button>
            <button
              onClick={handleSkip}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
            >
              Skip This Time
            </button>
          </div>
        </div>
      )}

      {/* Preset tones or editing */}
      {(!savedTone || isEditing) && (
        <>
          {!isEditing && (
            <>
              <h3 className="text-xl font-semibold text-white mb-6 text-center">
                Choose a style that fits you, or create your own
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {presetTones.map((preset) => (
                  <div
                    key={preset.id}
                    className={`bg-gray-800/50 hover:bg-gray-700/50 border rounded-lg p-4 cursor-pointer transition-all duration-300 ${
                      selectedPreset === preset.id 
                        ? 'border-spotify-green bg-spotify-green/10' 
                        : 'border-gray-700 hover:border-spotify-green/50'
                    }`}
                    onClick={() => handleUsePresetTone(preset)}
                  >
                    <h4 className="text-lg font-semibold text-white mb-2">{preset.name}</h4>
                    <p className="text-gray-400 text-sm">{preset.description}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Custom tone editor */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              {isEditing ? 'Edit Your Personal Style' : 'Create Your Personal Style'}
            </h3>
            <textarea
              value={customTone}
              onChange={(e) => setCustomTone(e.target.value)}
              placeholder="Describe your musical preferences, style, and what makes a perfect playlist for you..."
              className="w-full h-32 bg-gray-900 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 resize-none focus:border-spotify-green focus:outline-none"
            />
            <div className="flex gap-4 mt-4">
              <button
                onClick={handleSaveCustomTone}
                disabled={!customTone.trim()}
                className="px-6 py-3 bg-spotify-green hover:bg-spotify-green/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold rounded-lg transition-colors"
              >
                <Save className="w-5 h-5 inline mr-2" />
                Save My Style
              </button>
              {isEditing && (
                <button
                  onClick={() => {setIsEditing(false); setCustomTone('');}}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Skip option for first-time users */}
          {!savedTone && !isEditing && (
            <div className="text-center mt-8">
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-white transition-colors underline"
              >
                Skip for now (you can set this later)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PersonalTone;
