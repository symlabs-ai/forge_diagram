import React, { useState, useRef, useEffect } from 'react';
import { markdownThemes, MarkdownTheme } from '../utils/markdownThemes';

interface MarkdownThemeSelectorProps {
  currentThemeId: string;
  onThemeChange: (theme: MarkdownTheme) => void;
  isDarkMode: boolean;
}

// Preview colors for each theme
const themePreviewColors: Record<string, string> = {
  'default': '#6366f1',
  'default-dark': '#818cf8',
  'github': '#24292f',
  'github-dark': '#58a6ff',
  'medium': '#1a8917',
  'notion': '#37352f',
  'notion-dark': '#529cca',
  'typora': '#4183c4',
  'developer-dark': '#569cd6',
  'book': '#8b4513',
};

export const MarkdownThemeSelector: React.FC<MarkdownThemeSelectorProps> = ({
  currentThemeId,
  onThemeChange,
  isDarkMode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentTheme = markdownThemes.find(t => t.id === currentThemeId) || markdownThemes[0];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getThemePreviewColor = (theme: MarkdownTheme): string => {
    return themePreviewColors[theme.id] || '#6366f1';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
          isDarkMode
            ? 'bg-slate-700 hover:bg-slate-600 text-white'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
        }`}
        title="Select Reading Theme"
      >
        <div
          className="w-4 h-4 rounded-full border border-gray-400"
          style={{ backgroundColor: getThemePreviewColor(currentTheme) }}
        />
        <span className="hidden sm:inline">{currentTheme.name}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute top-full left-0 mt-1 w-48 rounded-lg shadow-lg z-50 py-1 ${
            isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
          }`}
        >
          {markdownThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => {
                onThemeChange(theme);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left ${
                theme.id === currentThemeId
                  ? isDarkMode
                    ? 'bg-slate-700 text-white'
                    : 'bg-blue-50 text-blue-700'
                  : isDarkMode
                    ? 'hover:bg-slate-700 text-gray-200'
                    : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div
                className="w-5 h-5 rounded-full border border-gray-400 flex-shrink-0"
                style={{ backgroundColor: getThemePreviewColor(theme) }}
              />
              <span>{theme.name}</span>
              {theme.id === currentThemeId && (
                <svg className="w-4 h-4 ml-auto text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
