import React, { useRef } from 'react';
import { FileNode, Workspace } from '../types';
import { FileTreeItem } from './FileTreeItem';
import { isFileSystemAccessSupported } from '../utils/fileSystemUtils';

interface FileExplorerProps {
  workspace: Workspace | null;
  isLoading: boolean;
  selectedPath: string | null;
  isDarkMode: boolean;
  onFileSelect: (file: FileNode) => void;
  onOpenFolder: () => void;
  onOpenFolderFallback: (files: FileList) => void;
  onCloseWorkspace: () => void;
  onRefresh: () => void;
  hasStoredWorkspace?: boolean;
  onReopenLastWorkspace?: () => Promise<boolean>;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  workspace,
  isLoading,
  selectedPath,
  isDarkMode,
  onFileSelect,
  onOpenFolder,
  onOpenFolderFallback,
  onCloseWorkspace,
  onRefresh,
  hasStoredWorkspace = false,
  onReopenLastWorkspace,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSupported = isFileSystemAccessSupported();

  const handleOpenClick = () => {
    if (isSupported) {
      onOpenFolder();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onOpenFolderFallback(files);
    }
    // Reset input
    e.target.value = '';
  };

  // No workspace open
  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div
          className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
        >
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
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <p className="mb-4 text-sm">Nenhuma pasta aberta</p>

          {/* Reopen last workspace button */}
          {hasStoredWorkspace && onReopenLastWorkspace && (
            <button
              onClick={onReopenLastWorkspace}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors mb-2 w-full ${
                isDarkMode
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Reabrindo...' : 'Reabrir Última Pasta'}
            </button>
          )}

          <button
            onClick={handleOpenClick}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors w-full ${
              isDarkMode
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-indigo-500 hover:bg-indigo-600 text-white'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Abrindo...' : 'Abrir Pasta'}
          </button>

          {!isSupported && (
            <p className="mt-3 text-xs text-gray-400">
              Use Chrome/Edge para editar arquivos diretamente
            </p>
          )}

          {/* Hidden file input for fallback */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            // @ts-ignore - webkitdirectory is not in standard types
            webkitdirectory=""
            multiple
            onChange={handleFileInputChange}
          />
        </div>
      </div>
    );
  }

  // Workspace open
  return (
    <div className="flex flex-col h-full">
      {/* Workspace header */}
      <div
        className={`flex items-center justify-between px-3 py-2 border-b ${
          isDarkMode ? 'border-slate-700' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 flex-shrink-0 ${
              isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <span
            className={`text-sm font-medium truncate ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
            title={workspace.name}
          >
            {workspace.name}
          </span>
          {workspace.isVirtual && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                isDarkMode ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
              }`}
              title="Modo somente leitura (use Chrome/Edge para editar)"
            >
              RO
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Refresh button */}
          {!workspace.isVirtual && (
            <button
              onClick={onRefresh}
              className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-600 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
              title="Atualizar"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          )}

          {/* Close workspace button */}
          <button
            onClick={onCloseWorkspace}
            className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-600 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
            title="Fechar pasta"
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
        </div>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-auto py-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div
              className={`animate-spin h-6 w-6 border-2 rounded-full ${
                isDarkMode
                  ? 'border-indigo-400 border-t-transparent'
                  : 'border-indigo-500 border-t-transparent'
              }`}
            />
          </div>
        ) : workspace.files.length === 0 ? (
          <div
            className={`p-4 text-center text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            Nenhum arquivo suportado encontrado
            <br />
            <span className="text-xs">
              (.mmd, .mermaid, .md, .puml, .plantuml)
            </span>
          </div>
        ) : (
          workspace.files.map(node => (
            <FileTreeItem
              key={node.path}
              node={node}
              level={0}
              isDarkMode={isDarkMode}
              selectedPath={selectedPath}
              onSelect={onFileSelect}
            />
          ))
        )}
      </div>

      {/* Hidden file input for fallback */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        // @ts-ignore
        webkitdirectory=""
        multiple
        onChange={handleFileInputChange}
      />
    </div>
  );
};
