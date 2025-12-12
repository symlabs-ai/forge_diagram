import React from 'react';

export type MobileTab = 'editor' | 'preview';

interface MobileTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  isDarkMode: boolean;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeTab,
  onTabChange,
  isDarkMode,
}) => {
  return (
    <div className={`flex border-b ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
      <button
        onClick={() => onTabChange('editor')}
        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors touch-target ${
          activeTab === 'editor'
            ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Editor
        </div>
      </button>
      <button
        onClick={() => onTabChange('preview')}
        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors touch-target ${
          activeTab === 'preview'
            ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
          Preview
        </div>
      </button>
    </div>
  );
};
