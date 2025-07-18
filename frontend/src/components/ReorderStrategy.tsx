import React from 'react';
import { Settings, Zap, RefreshCw, Brain } from 'lucide-react';

interface ReorderStrategyProps {
  onStrategySelected: (method: string) => void;
  onPreviewChanges?: () => void;
  previewLoading?: boolean;
}

const reorderMethods = [
  {
    id: 'auto',
    name: 'Smart Choice',
    description: 'AI automatically selects the best approach for your playlist. Great for most users.',
    icon: <Brain className="w-12 h-12 text-blue-400" />,
    recommended: true,
    badge: 'Recommended',
  },
  {
    id: 'intelligent',
    name: 'Gentle Reorder',
    description: 'Minimal changes while optimizing flow. Perfect for playlists you mostly love.',
    icon: <Zap className="w-12 h-12 text-green-400" />,
    recommended: false,
    badge: 'Subtle',
  },
  {
    id: 'full_rewrite',
    name: 'Complete Restructure',
    description: 'Full reimagining from scratch for maximum narrative impact.',
    icon: <RefreshCw className="w-12 h-12 text-orange-400" />,
    recommended: false,
    badge: 'Bold',
  },
];

const ReorderStrategy: React.FC<ReorderStrategyProps> = ({ 
  onStrategySelected, 
  onPreviewChanges, 
  previewLoading = false 
}) => {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-4">Choose Reordering Method</h2>
      <p className="text-gray-400 text-center mb-8">
        How would you like us to rearrange your playlist?
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {reorderMethods.map((method) => (
          <div
            key={method.id}
            className={`bg-gray-800 rounded-lg p-6 flex flex-col items-center cursor-pointer hover:bg-gray-700 transition-colors relative ${
              method.recommended ? 'ring-2 ring-spotify-green' : ''
            }`}
            onClick={() => onStrategySelected(method.id)}
          >
            {method.recommended && (
              <div className="absolute -top-2 -right-2 bg-spotify-green text-black text-xs font-bold px-2 py-1 rounded-full">
                {method.badge}
              </div>
            )}
            {!method.recommended && (
              <div className={`absolute -top-2 -right-2 text-xs font-bold px-2 py-1 rounded-full ${
                method.badge === 'Subtle' ? 'bg-green-600 text-green-100' : 'bg-orange-600 text-orange-100'
              }`}>
                {method.badge}
              </div>
            )}
            <div className="mb-4">{method.icon}</div>
            <h3 className="text-xl font-semibold mb-2 text-center">{method.name}</h3>
            <p className="text-gray-400 text-center text-sm">{method.description}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-gray-800 rounded-lg">
        <h4 className="text-lg font-semibold mb-2 text-spotify-green">💡 What's the difference?</h4>
        <ul className="text-gray-300 text-sm space-y-2">
          <li><strong>Smart Choice:</strong> We analyze your playlist and pick the most efficient method</li>
          <li><strong>Gentle Reorder:</strong> Makes fewer changes, good for playlists you're mostly happy with</li>
          <li><strong>Complete Restructure:</strong> Perfect reordering, but changes the entire playlist structure</li>
        </ul>
      </div>

      {onPreviewChanges && (
        <div className="mt-6 text-center">
          <button
            onClick={onPreviewChanges}
            disabled={previewLoading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium flex items-center gap-2 mx-auto transition-colors"
          >
            {previewLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating Preview...
              </>
            ) : (
              <>
                <Settings size={20} />
                Preview Changes First
              </>
            )}
          </button>
          <p className="text-gray-400 text-sm mt-2">
            See before/after comparison before applying changes
          </p>
        </div>
      )}
    </div>
  );
};

export default ReorderStrategy;
