import React from 'react';
import { Music, Zap, Sparkles, Brain } from 'lucide-react';

interface ReorderStyleProps {
  onStyleSelected: (style: string) => void;
}

const reorderStyles = [
  {
    id: 'emotional_journey',
    name: 'Emotional Journey',
    description: 'Creates emotional crescendos from melancholy to uplifting.',
    icon: <Sparkles className="w-12 h-12 text-pink-400" />,
  },
  {
    id: 'energy_flow',
    name: 'Energy Flow',
    description: 'Perfect for workouts with chill → hype → cool down progression.',
    icon: <Zap className="w-12 h-12 text-yellow-400" />,
  },
  {
    id: 'narrative_arc',
    name: 'Narrative Arc',
    description: 'Tells a complete story through your music.',
    icon: <Brain className="w-12 h-12 text-purple-400" />,
  },
  {
    id: 'vibe_matching',
    name: 'Vibe Matching',
    description: 'Groups similar moods and energies together.',
    icon: <Music className="w-12 h-12 text-spotify-green" />,
  },
];

const ReorderStyle: React.FC<ReorderStyleProps> = ({ onStyleSelected }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">Choose a Reordering Style</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {reorderStyles.map((style) => (
          <div
            key={style.id}
            className="bg-gray-800 rounded-lg p-6 flex flex-col items-center cursor-pointer hover:bg-gray-700 transition-colors"
            onClick={() => onStyleSelected(style.id)}
          >
            <div className="mb-4">{style.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{style.name}</h3>
            <p className="text-gray-400 text-center">{style.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReorderStyle;