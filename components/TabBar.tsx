import React, { useState } from 'react';
import { DiagramTab, MAX_TABS } from '../types';

interface TabBarProps {
  tabs: DiagramTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onAddTab: () => void;
  onRenameTab: (id: string, name: string) => void;
  canAddTab: boolean;
  isDarkMode: boolean;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onAddTab,
  onRenameTab,
  canAddTab,
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

          {/* Close button */}
          {tabs.length > 1 && (
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
          )}
        </div>
      ))}

      {/* Add tab button */}
      <button
        onClick={onAddTab}
        disabled={!canAddTab}
        className={`p-1.5 rounded transition-colors ${
          canAddTab
            ? isDarkMode
              ? 'text-gray-400 hover:bg-slate-700 hover:text-white'
              : 'text-gray-500 hover:bg-gray-200 hover:text-gray-900'
            : 'opacity-40 cursor-not-allowed'
        }`}
        title={canAddTab ? 'New tab' : `Maximum ${MAX_TABS} tabs reached`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Tab count indicator */}
      <span className={`text-xs ml-auto pr-2 ${
        isDarkMode ? 'text-gray-500' : 'text-gray-400'
      }`}>
        {tabs.length}/{MAX_TABS}
      </span>
    </div>
  );
};
