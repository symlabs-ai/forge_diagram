import React from 'react';
import { ActivityView } from '../types';

interface ActivityBarProps {
  activeView: ActivityView;
  onViewChange: (view: ActivityView) => void;
  isDarkMode: boolean;
  isSidebarOpen: boolean;
}

interface ActivityItem {
  id: ActivityView;
  label: string;
  icon: React.ReactNode;
}

const activities: ActivityItem[] = [
  {
    id: 'explorer',
    label: 'Explorer',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    )
  },
  {
    id: 'search',
    label: 'Search',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    )
  },
  {
    id: 'diagrams',
    label: 'Saved Diagrams',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    )
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }
];

export const ActivityBar: React.FC<ActivityBarProps> = ({
  activeView,
  onViewChange,
  isDarkMode,
  isSidebarOpen
}) => {
  return (
    <div
      className={`flex flex-col items-center py-2 w-12 border-r ${
        isDarkMode
          ? 'bg-slate-900 border-slate-700'
          : 'bg-gray-100 border-gray-200'
      }`}
    >
      {activities.map(({ id, label, icon }) => {
        const isActive = activeView === id && isSidebarOpen;
        return (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className={`p-3 my-0.5 rounded-lg transition-colors relative ${
              isActive
                ? isDarkMode
                  ? 'text-white'
                  : 'text-indigo-600'
                : isDarkMode
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-500 hover:text-gray-900'
            }`}
            title={label}
          >
            {/* Active indicator bar */}
            {isActive && (
              <div
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r ${
                  isDarkMode ? 'bg-white' : 'bg-indigo-600'
                }`}
              />
            )}
            {icon}
          </button>
        );
      })}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom section - could add more items here */}
    </div>
  );
};
