import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FileNode, SearchResult, Workspace } from '../types';
import { getFileIcon } from '../utils/fileSystemUtils';

interface SearchPanelProps {
  workspace: Workspace | null;
  isDarkMode: boolean;
  onSearch: (query: string) => Promise<SearchResult[]>;
  onResultClick: (file: FileNode, line: number) => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  workspace,
  isDarkMode,
  onSearch,
  onResultClick
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim() || !workspace) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    searchTimeoutRef.current = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const searchResults = await onSearch(searchQuery);
        setResults(searchResults);
        setHasSearched(true);
      } catch (e) {
        console.error('Search error:', e);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [workspace, onSearch]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    handleSearch(newQuery);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  // Group results by file
  const groupedResults = results.reduce((acc, result) => {
    const key = result.file.path;
    if (!acc[key]) {
      acc[key] = { file: result.file, matches: [] };
    }
    acc[key].matches.push(result);
    return acc;
  }, {} as Record<string, { file: FileNode; matches: SearchResult[] }>);

  // No workspace
  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto mb-4 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="text-sm">Abra uma pasta para buscar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <div className={`p-2 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Buscar nos arquivos..."
            className={`w-full pl-8 pr-8 py-1.5 text-sm rounded border ${
              isDarkMode
                ? 'bg-slate-900 border-slate-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
          />
          {/* Search icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-400'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {/* Clear button */}
          {query && (
            <button
              onClick={handleClear}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded ${
                isDarkMode ? 'hover:bg-slate-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto">
        {isSearching ? (
          <div className="flex items-center justify-center py-8">
            <div
              className={`animate-spin h-5 w-5 border-2 rounded-full ${
                isDarkMode
                  ? 'border-indigo-400 border-t-transparent'
                  : 'border-indigo-500 border-t-transparent'
              }`}
            />
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className={`p-4 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Nenhum resultado encontrado
          </div>
        ) : hasSearched ? (
          <div className="py-1">
            {/* Results count */}
            <div className={`px-3 py-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {results.length} resultado{results.length !== 1 ? 's' : ''} em{' '}
              {Object.keys(groupedResults).length} arquivo{Object.keys(groupedResults).length !== 1 ? 's' : ''}
            </div>

            {/* Grouped results */}
            {Object.values(groupedResults).map(({ file, matches }) => (
              <div key={file.path} className="mb-2">
                {/* File header */}
                <div
                  className={`flex items-center gap-2 px-3 py-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  <FileIcon type={getFileIcon(file.name)} />
                  <span className="text-sm font-medium truncate" title={file.path}>
                    {file.name}
                  </span>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    ({matches.length})
                  </span>
                </div>

                {/* Matches */}
                {matches.map((match, index) => (
                  <div
                    key={`${match.file.path}-${match.line}-${index}`}
                    onClick={() => onResultClick(match.file, match.line)}
                    className={`flex items-start gap-2 px-3 py-1 cursor-pointer ${
                      isDarkMode
                        ? 'hover:bg-slate-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {/* Line number */}
                    <span
                      className={`text-xs w-8 text-right flex-shrink-0 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}
                    >
                      {match.line}
                    </span>
                    {/* Content with highlight */}
                    <span className={`text-sm truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <HighlightedText
                        text={match.content}
                        query={query}
                        isDarkMode={isDarkMode}
                      />
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className={`p-4 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Digite para buscar
          </div>
        )}
      </div>
    </div>
  );
};

// Helper components
const FileIcon: React.FC<{ type: string }> = ({ type }) => {
  const colorClass = type === 'diagram' ? 'text-indigo-500'
    : type === 'markdown' ? 'text-blue-500'
    : type === 'plantuml' ? 'text-green-500'
    : 'text-gray-400';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`h-4 w-4 flex-shrink-0 ${colorClass}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  );
};

const HighlightedText: React.FC<{ text: string; query: string; isDarkMode: boolean }> = ({
  text,
  query,
  isDarkMode
}) => {
  if (!query) return <>{text}</>;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className={`px-0.5 rounded ${
              isDarkMode ? 'bg-yellow-600 text-white' : 'bg-yellow-200 text-yellow-900'
            }`}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};
