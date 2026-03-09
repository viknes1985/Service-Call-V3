import React from 'react';
import { Search, Home, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'find' | 'home' | 'profile';
  onTabChange: (tab: 'find' | 'home' | 'profile') => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 grid grid-cols-3 z-50">
      <button
        onClick={() => onTabChange('find')}
        className={`flex flex-col items-center justify-center py-3 transition-colors hover:bg-blue-50 ${
          activeTab === 'find' ? 'text-blue-600 bg-blue-50/50' : 'text-gray-400'
        }`}
      >
        <Search size={24} />
        <span className="text-xs font-medium">Find</span>
      </button>
      
      <button
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center justify-center py-3 transition-colors hover:bg-blue-50 ${
          activeTab === 'home' ? 'text-blue-600 bg-blue-50/50' : 'text-gray-400'
        }`}
      >
        <Home size={24} />
        <span className="text-xs font-medium">Home</span>
      </button>
      
      <button
        onClick={() => onTabChange('profile')}
        className={`flex flex-col items-center justify-center py-3 transition-colors hover:bg-blue-50 ${
          activeTab === 'profile' ? 'text-blue-600 bg-blue-50/50' : 'text-gray-400'
        }`}
      >
        <User size={24} />
        <span className="text-xs font-medium">Profile</span>
      </button>
    </div>
  );
}
