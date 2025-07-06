import React, { useState, useEffect } from 'react';
import { Settings, User, Edit3, Save, Trash2, ArrowLeft } from 'lucide-react';

const UserSettings: React.FC = () => {
  const [personalTone, setPersonalTone] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [tempTone, setTempTone] = useState<string>('');

  useEffect(() => {
    const saved = localStorage.getItem('user_personal_tone');
    if (saved) {
      setPersonalTone(saved);
    }
  }, []);

  const handleEdit = () => {
    setTempTone(personalTone);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (tempTone.trim()) {
      setPersonalTone(tempTone.trim());
      localStorage.setItem('user_personal_tone', tempTone.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setTempTone('');
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete your personal style? This cannot be undone.')) {
      setPersonalTone('');
      localStorage.removeItem('user_personal_tone');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <a
        href="/"
        className="flex items-center gap-2 mb-6 text-spotify-light hover:text-white transition-colors"
      >
        <ArrowLeft size={20} /> Back to Dashboard
      </a>
      
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-spotify-green" />
          <h2 className="text-2xl font-bold text-white">User Settings</h2>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Music Style
              </h3>
              {personalTone && !isEditing && (
                <div className="flex gap-2">
                  <button
                    onClick={handleEdit}
                    className="text-spotify-green hover:text-spotify-green/80 transition-colors"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {!personalTone && !isEditing ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">You haven't set your personal music style yet.</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 bg-spotify-green hover:bg-spotify-green/80 text-black font-semibold rounded-lg transition-colors"
                >
                  Set Your Style
                </button>
              </div>
            ) : isEditing ? (
              <div>
                <textarea
                  value={tempTone}
                  onChange={(e) => setTempTone(e.target.value)}
                  placeholder="Describe your musical preferences, style, and what makes a perfect playlist for you..."
                  className="w-full h-32 bg-gray-900 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 resize-none focus:border-spotify-green focus:outline-none"
                />
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={handleSave}
                    disabled={!tempTone.trim()}
                    className="px-6 py-3 bg-spotify-green hover:bg-spotify-green/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold rounded-lg transition-colors"
                  >
                    <Save className="w-5 h-5 inline mr-2" />
                    Save Style
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                <p className="text-gray-300 leading-relaxed">{personalTone}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
