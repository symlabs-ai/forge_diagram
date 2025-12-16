import React, { useState } from 'react';
import { DiagramTab } from '../types';

interface TabBarProps {
  tabs: DiagramTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onRenameTab: (id: string, name: string) => void;
  isDarkMode: boolean;
}

// Icon for diagram tabs
const DiagramIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
  </svg>
);

// Icon for markdown tabs
const MarkdownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onRenameTab,
  isDarkMode,
}) => {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleDoubleClick = (tab: DiagramTab) => {
    setEditingTabId(tab.id);
    setEditValue(tab.name);
  };

  const handleRenameSubmit = (id: string) => {
    if (editValue.trim()) {
      onRenameTab(id, editValue.trim());
    }
    setEditingTabId(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleRenameSubmit(id);
    } else if (e.key === 'Escape') {
      setEditingTabId(null);
      setEditValue('');
    }
  };

  return (
    <div className={`flex items-center gap-1 px-2 py-1 overflow-x-auto flex-shrink-0 h-full ${
      isDarkMode ? 'bg-slate-800 border-b border-slate-700' : 'bg-gray-100 border-b border-gray-200'
    }`}>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`group flex items-center gap-1 px-3 py-1.5 rounded-t text-sm cursor-pointer transition-colors ${
            tab.id === activeTabId
              ? isDarkMode
                ? 'bg-slate-700 text-white'
                : 'bg-white text-gray-900 shadow-sm'
              : isDarkMode
                ? 'text-gray-400 hover:bg-slate-700/50 hover:text-gray-200'
                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
          }`}
          onClick={() => onSelectTab(tab.id)}
        >
          {/* Tab type icon */}
          {tab.type === 'markdown' ? (
            <MarkdownIcon className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
          ) : (
            <DiagramIcon className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
          )}

          {/* Tab name or edit input */}
          {editingTabId === tab.id ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleRenameSubmit(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, tab.id)}
              className={`w-24 px-1 py-0.5 text-xs rounded border ${
                isDarkMode
                  ? 'bg-slate-600 border-slate-500 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="truncate max-w-[120px]"
              onDoubleClick={() => handleDoubleClick(tab)}
              title={tab.name}
            >
              {tab.isDirty && <span className="text-yellow-500 mr-1">*</span>}
              {tab.name}
            </span>
          )}

          {/* Close button - always show, allows closing last tab to show WelcomePage */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCloseTab(tab.id);
            }}
            className={`ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
              isDarkMode
                ? 'hover:bg-slate-600 text-gray-400 hover:text-white'
                : 'hover:bg-gray-300 text-gray-500 hover:text-gray-900'
            }`}
            title="Close tab"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}

    </div>
  );
};
