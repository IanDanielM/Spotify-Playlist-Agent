import React, { useState } from 'react';
import UserProfileCard from './UserProfileCard';
import UserAnalytics from './UserAnalytics';
import UserPreferences from './UserPreferences';
import { ArrowLeft, Settings as SettingsIcon, User, BarChart3, Heart } from 'lucide-react';

interface SettingsProps {
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'preferences', label: 'Preferences', icon: Heart },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <UserProfileCard />
            </div>
            
            <div className="space-y-6">
              <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Account Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-gray-300">Default Reorder Method</label>
                    <select className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600">
                      <option value="auto">Smart Auto</option>
                      <option value="intelligent">Intelligent Moves</option>
                      <option value="full_rewrite">Complete Rewrite</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-gray-300">Auto-enable Async Mode</label>
                    <input type="checkbox" className="w-4 h-4 text-spotify-green" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-gray-300">Show Progress Notifications</label>
                    <input type="checkbox" className="w-4 h-4 text-spotify-green" defaultChecked />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Subscription</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Current Plan</span>
                    <span className="text-spotify-green font-semibold">Free</span>
                  </div>
                  
                  <button className="w-full bg-spotify-green hover:bg-spotify-light text-black font-semibold py-2 px-4 rounded-lg transition-colors">
                    Upgrade to Premium
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'analytics':
        return <UserAnalytics />;
      
      case 'preferences':
        return <UserPreferences />;
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-spotify-light hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-6 h-6 text-spotify-green" />
          <h1 className="text-2xl font-bold text-white">Settings</h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-8 bg-gray-800/50 p-1 rounded-lg border border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-spotify-green text-black font-semibold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Settings;
