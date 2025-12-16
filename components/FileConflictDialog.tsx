import React from 'react';

interface FileConflictDialogProps {
  isOpen: boolean;
  filePath: string;
  isDarkMode: boolean;
  onReload: () => void;      // Discard local changes and reload from disk
  onOverwrite: () => void;   // Keep local changes (will overwrite on next save)
  onCompare?: () => void;    // Optional: show diff (future feature)
}

export const FileConflictDialog: React.FC<FileConflictDialogProps> = ({
  isOpen,
  filePath,
  isDarkMode,
  onReload,
  onOverwrite,
  onCompare,
}) => {
  if (!isOpen) return null;

  const fileName = filePath.split('/').pop() || filePath;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`w-full max-w-md rounded-lg shadow-xl ${
          isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isDarkMode ? 'bg-yellow-500/20' : 'bg-yellow-100'}`}>
              <svg
                className="w-6 h-6 text-yellow-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">File Changed on Disk</h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            The file <span className="font-mono font-semibold">{fileName}</span> has been modified by another program.
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            You have unsaved changes. What would you like to do?
          </p>
        </div>

        {/* Actions */}
        <div className={`px-6 py-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'} flex flex-col sm:flex-row gap-3`}>
          <button
            onClick={onReload}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Reload from Disk
          </button>
          <button
            onClick={onOverwrite}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            Keep My Changes
          </button>
        </div>

        {/* Info footer */}
        <div className={`px-6 py-3 text-xs ${isDarkMode ? 'text-gray-500 bg-slate-900/50' : 'text-gray-400 bg-gray-50'} rounded-b-lg`}>
          <p>
            <strong>Reload:</strong> Discards your changes and loads the file from disk.
          </p>
          <p className="mt-1">
            <strong>Keep:</strong> Keeps your version. Save to overwrite the disk version.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FileConflictDialog;
