import React, { useState, useRef, useEffect } from 'react';
import { ToolbarProps } from '../types';

export const Toolbar: React.FC<ToolbarProps> = ({
  mode,
  isDarkMode,
  toggleDarkMode,
  onPrint,
  orientation,
  toggleOrientation,
  zoomIn,
  zoomOut,
  onRedraw,
  // Export
  onExportPng,
  onExportSvg,
  onExportMarkdown,
  onCopySvg,
  // Share
  onShare,
  onEmbed,
  // Persistence
  onSave,
  onLoad,
  onOpenFolder,
  // Theme & Templates
  themeSelector,
  templateSelector,
  markdownThemeSelector,
  // Fullscreen
  isFullscreen,
  onToggleFullscreen,
  // Minimap
  showMinimap,
  onToggleMinimap,
  // Mobile
  isMobile,
}) => {
  const buttonClass = "p-2 rounded hover:bg-gray-300 dark:hover:bg-slate-600";
  const [showOpenMenu, setShowOpenMenu] = useState(false);
  const openMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuRef.current && !openMenuRef.current.contains(event.target as Node)) {
        setShowOpenMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDiagramMode = mode === 'diagram';

  // Mobile toolbar - simplified with only essential buttons
  if (isMobile) {
    return (
      <div className="flex items-center justify-between p-2 bg-gray-200 dark:bg-slate-700 shadow-md no-print">
        {/* Theme selector based on mode */}
        {isDiagramMode ? templateSelector : markdownThemeSelector}

        {/* Dark mode */}
        <button
          onClick={toggleDarkMode}
          className={buttonClass}
          title="Toggle Dark Mode"
        >
          {isDarkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>

        {/* Diagram-specific controls */}
        {isDiagramMode && toggleOrientation && (
          <button
            onClick={toggleOrientation}
            className={buttonClass}
            title={`Toggle Orientation (${orientation})`}
          >
            {orientation === 'TD' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        )}

        {/* Zoom controls - diagram only */}
        {isDiagramMode && zoomIn && (
          <button onClick={zoomIn} className={buttonClass} title="Zoom In">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        {isDiagramMode && zoomOut && (
          <button onClick={zoomOut} className={buttonClass} title="Zoom Out">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        {isDiagramMode && onRedraw && (
          <button onClick={onRedraw} className={buttonClass} title="Redraw">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        {/* Share - diagram only */}
        {isDiagramMode && onShare && (
          <button onClick={onShare} className={buttonClass} title="Compartilhar & Exportar">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
          </button>
        )}

        {/* Print - available for both modes */}
        <button onClick={onPrint} className={buttonClass} title="Print / Export PDF">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    );
  }

  // Desktop toolbar - full version
  return (
    <div className="flex items-center justify-between p-2 bg-gray-200 dark:bg-slate-700 shadow-md no-print">
      {/* Left section: Logo + File operations */}
      <div className="flex items-center space-x-1">
        {/* Logo/Brand */}
        <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg mr-3">
          forge Diagram
        </span>

        <div className="w-px h-6 bg-gray-400 dark:bg-slate-500 mr-1" />

        <button
          onClick={onSave}
          className={buttonClass}
          title="Save (Ctrl+S)"
        >
          {/* Floppy disk icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 5a2 2 0 012-2h8.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V15a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
            <path fill={isDarkMode ? '#1e293b' : '#fff'} d="M6 4h5v3a1 1 0 001 1h2v8H6V4z" />
            <path fill="currentColor" d="M7 12h6v4H7v-4z" />
          </svg>
        </button>
        {/* Open dropdown */}
        <div className="relative" ref={openMenuRef}>
          <button
            onClick={() => setShowOpenMenu(!showOpenMenu)}
            className={`${buttonClass} flex items-center gap-1`}
            title="Open"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clipRule="evenodd" />
              <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z" />
            </svg>
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showOpenMenu && (
            <div className={`absolute top-full left-0 mt-1 w-40 rounded-lg shadow-lg z-50 py-1 ${
              isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
            }`}>
              <button
                onClick={() => {
                  onLoad();
                  setShowOpenMenu(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${
                  isDarkMode ? 'hover:bg-slate-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                Open File...
              </button>
              {onOpenFolder && (
                <button
                  onClick={() => {
                    onOpenFolder();
                    setShowOpenMenu(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${
                    isDarkMode ? 'hover:bg-slate-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                  Open Folder...
                </button>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Center section: View controls */}
      <div className="flex items-center space-x-1">
        {/* Theme & Template selectors based on mode */}
        {isDiagramMode ? (
          <>
            {themeSelector}
            {templateSelector}
          </>
        ) : (
          <>
            {markdownThemeSelector}
          </>
        )}

        <div className="w-px h-6 bg-gray-400 dark:bg-slate-500 mx-1" />

        <button
          onClick={toggleDarkMode}
          className={buttonClass}
          title="Toggle Dark Mode"
        >
          {isDarkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>

        {/* Diagram-specific controls */}
        {isDiagramMode && toggleOrientation && (
          <>
            <button
              onClick={toggleOrientation}
              className={buttonClass}
              title={`Toggle Orientation (Current: ${orientation})`}
            >
              {orientation === 'TD' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            <div className="w-px h-6 bg-gray-400 dark:bg-slate-500 mx-1" />

            {zoomIn && (
              <button
                onClick={zoomIn}
                className={buttonClass}
                title="Zoom In"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            {zoomOut && (
              <button
                onClick={zoomOut}
                className={buttonClass}
                title="Zoom Out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            {onRedraw && (
              <button
                onClick={onRedraw}
                className={buttonClass}
                title="Redraw"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
            )}

            <div className="w-px h-6 bg-gray-400 dark:bg-slate-500 mx-1" />
          </>
        )}

        {/* Fullscreen toggle - available for both modes */}
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className={buttonClass}
            title={isFullscreen ? "Exit Fullscreen (F11)" : "Fullscreen (F11)"}
          >
            {isFullscreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 110-2h4a1 1 0 011 1v4a1 1 0 11-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 112 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 110 2H4a1 1 0 01-1-1v-4zm13 0a1 1 0 10-2 0v1.586l-2.293-2.293a1 1 0 00-1.414 1.414L13.586 15H12a1 1 0 100 2h4a1 1 0 001-1v-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H5v3a1 1 0 01-2 0V4zm12 0a1 1 0 011 1v3a1 1 0 11-2 0V5h-3a1 1 0 110-2h4zM3 12a1 1 0 011 1v3h3a1 1 0 110 2H4a1 1 0 01-1-1v-4a1 1 0 011-1zm13 0a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 110-2h3v-3a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        )}

        {/* Minimap toggle - diagram only */}
        {isDiagramMode && onToggleMinimap && (
          <button
            onClick={onToggleMinimap}
            className={`${buttonClass} ${showMinimap ? 'text-blue-500' : ''}`}
            title={showMinimap ? "Hide Minimap" : "Show Minimap"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2H5zm9 6a1 1 0 10-2 0v2a1 1 0 102 0v-2zm-4-1a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1zM7 9a1 1 0 00-1 1v2a1 1 0 102 0v-2a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Right section: Share & Export */}
      <div className="flex items-center space-x-1">
        {/* Share & Embed - diagram only */}
        {isDiagramMode && onShare && (
          <button
            onClick={onShare}
            className={buttonClass}
            title="Compartilhar & Exportar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
          </button>
        )}
        {isDiagramMode && onEmbed && (
          <button
            onClick={onEmbed}
            className={buttonClass}
            title="Embed Code"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        {isDiagramMode && (onShare || onEmbed) && (
          <div className="w-px h-6 bg-gray-400 dark:bg-slate-500 mx-1" />
        )}

        {/* Print - available for both modes */}
        <button
          onClick={onPrint}
          className={buttonClass}
          title="Print / Export PDF"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};
