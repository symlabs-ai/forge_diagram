import React, { useRef, useState } from 'react';
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
  onCreateFile: (parentPath: string | null, name: string, content: string) => Promise<string | null>;
  onRenameFile: (file: FileNode, newName: string) => Promise<boolean>;
  onDeleteFile: (file: FileNode) => Promise<boolean>;
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
  onCreateFile,
  onRenameFile,
  onDeleteFile,
  hasStoredWorkspace = false,
  onReopenLastWorkspace,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const isSupported = isFileSystemAccessSupported();
  const [expandAll, setExpandAll] = useState<boolean | null>(null); // null = user controlled
  const [isAllExpanded, setIsAllExpanded] = useState(false); // Toggle state for expand/collapse button
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [pendingOpenPath, setPendingOpenPath] = useState<string | null>(null); // File to open after rename
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set()); // Track manually expanded folders
  const [pathToOpenAfterRefresh, setPathToOpenAfterRefresh] = useState<string | null>(null); // Path to open after workspace refresh
  const [fileToDelete, setFileToDelete] = useState<FileNode | null>(null); // File pending deletion confirmation

  // Close add menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Watch for workspace changes and open pending file
  React.useEffect(() => {
    if (!pathToOpenAfterRefresh || !workspace) return;

    // Find the file in the updated workspace
    const findNode = (nodes: FileNode[], path: string): FileNode | null => {
      for (const node of nodes) {
        if (node.path === path) return node;
        if (node.children) {
          const found = findNode(node.children, path);
          if (found) return found;
        }
      }
      return null;
    };

    const file = findNode(workspace.files, pathToOpenAfterRefresh);
    if (file) {
      onFileSelect(file);
      setPathToOpenAfterRefresh(null);
    }
  }, [workspace, pathToOpenAfterRefresh, onFileSelect]);

  // Toggle expand/collapse all
  const handleToggleExpandAll = () => {
    const newState = !isAllExpanded;
    setIsAllExpanded(newState);
    setExpandAll(newState);
    // Reset to user control after a tick
    setTimeout(() => setExpandAll(null), 100);
  };

  // Get selected folder path for creating new files
  const getSelectedFolderPath = (): string | null => {
    if (!selectedPath || !workspace) return null;

    // Find the node
    const findNode = (nodes: FileNode[], path: string): FileNode | null => {
      for (const node of nodes) {
        if (node.path === path) return node;
        if (node.children) {
          const found = findNode(node.children, path);
          if (found) return found;
        }
      }
      return null;
    };

    const node = findNode(workspace.files, selectedPath);
    if (!node) return null;

    // If it's a folder, use it; otherwise use parent folder
    if (node.type === 'folder') {
      return node.path;
    } else {
      // Get parent path
      const parts = node.path.split('/');
      parts.pop();
      return parts.length > 0 ? parts.join('/') : null;
    }
  };

  // Helper to create file and enter rename mode
  const createFileAndEdit = async (name: string, content: string) => {
    setShowAddMenu(false);
    const parentPath = getSelectedFolderPath();

    // If creating inside a folder, expand that folder
    if (parentPath) {
      setExpandedPaths(prev => new Set(prev).add(parentPath));
    }

    const newFilePath = await onCreateFile(parentPath, name, content);
    if (newFilePath) {
      // Small delay to allow React to process the workspace update
      // then enter rename mode
      setTimeout(() => {
        setEditingPath(newFilePath);
        setPendingOpenPath(newFilePath);
      }, 50);
    }
  };

  // Create new file handlers - create file then immediately enter rename mode
  const handleCreateMermaid = () => {
    const content = `flowchart TD
    A[Start] --> B[Process]
    B --> C[End]
`;
    createFileAndEdit('untitled.mmd', content);
  };

  const handleCreatePlantUML = () => {
    const content = `@startuml
Alice -> Bob: Hello
Bob --> Alice: Hi!
@enduml
`;
    createFileAndEdit('untitled.puml', content);
  };

  const handleCreateMarkdown = () => {
    const content = `# Untitled

Write your content here...
`;
    createFileAndEdit('untitled.md', content);
  };

  // Handle rename
  const handleRename = async (file: FileNode, newName: string) => {
    const wasPendingOpen = pendingOpenPath === file.path;

    if (newName && newName !== file.name) {
      const success = await onRenameFile(file, newName);

      // If this was a newly created file, open it after rename
      if (wasPendingOpen && success) {
        // Calculate the new path after rename
        const pathParts = file.path.split('/');
        pathParts.pop();
        const newPath = pathParts.length > 0 ? `${pathParts.join('/')}/${newName}` : newName;

        // Set path to open - useEffect will open it when workspace updates
        setPathToOpenAfterRefresh(newPath);
      }
    } else if (wasPendingOpen) {
      // Name wasn't changed but file was newly created - open with original name
      onFileSelect(file);
    }

    setEditingPath(null);
    setPendingOpenPath(null);
  };

  // Start editing (for F2)
  const handleStartEditing = (path: string) => {
    setEditingPath(path);
  };

  // Handle delete request (shows confirmation)
  const handleDeleteRequest = (file: FileNode) => {
    setFileToDelete(file);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (fileToDelete) {
      await onDeleteFile(fileToDelete);
      setFileToDelete(null);
    }
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setFileToDelete(null);
  };

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
          {/* New file button with dropdown */}
          {!workspace?.isVirtual && (
            <div className="relative" ref={addMenuRef}>
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-600 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
                title="Novo arquivo"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>

              {/* Dropdown menu */}
              {showAddMenu && (
                <div className={`absolute top-full right-0 mt-1 py-1 rounded-md shadow-lg border z-50 min-w-[160px] ${
                  isDarkMode
                    ? 'bg-slate-700 border-slate-600'
                    : 'bg-white border-gray-200'
                }`}>
                  <button
                    onClick={handleCreateMermaid}
                    className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 ${
                      isDarkMode
                        ? 'hover:bg-slate-600 text-gray-200'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    Mermaid (.mmd)
                  </button>
                  <button
                    onClick={handleCreatePlantUML}
                    className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 ${
                      isDarkMode
                        ? 'hover:bg-slate-600 text-gray-200'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                    PlantUML (.puml)
                  </button>
                  <button
                    onClick={handleCreateMarkdown}
                    className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 ${
                      isDarkMode
                        ? 'hover:bg-slate-600 text-gray-200'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Markdown (.md)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Toggle expand/collapse all button */}
          <button
            onClick={handleToggleExpandAll}
            className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-600 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
            title={isAllExpanded ? "Recolher tudo" : "Expandir tudo"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 transition-transform ${isAllExpanded ? 'rotate-45' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isAllExpanded ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              )}
            </svg>
          </button>

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

      {/* Virtual workspace warning */}
      {workspace.isVirtual && (
        <div className={`mx-2 mb-2 p-2 rounded text-xs ${
          isDarkMode
            ? 'bg-yellow-900/50 text-yellow-200 border border-yellow-700'
            : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
        }`}>
          <div className="font-medium mb-1">⚠️ Modo offline</div>
          <div className="opacity-80">
            Seu browser não suporta File System Access API.
            Mudanças externas não serão detectadas.
          </div>
          <div className="mt-1 opacity-60">
            Use Chrome/Edge para sincronização em tempo real.
          </div>
        </div>
      )}

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
              expandAll={expandAll}
              editingPath={editingPath}
              onStartEditing={handleStartEditing}
              onRename={handleRename}
              onDelete={handleDeleteRequest}
              forceExpandPaths={expandedPaths}
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

      {/* Delete confirmation dialog */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`p-4 rounded-lg shadow-xl max-w-sm w-full mx-4 ${
            isDarkMode ? 'bg-slate-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Confirmar exclusão
            </h3>
            <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Tem certeza que deseja excluir{' '}
              <strong>{fileToDelete.type === 'folder' ? 'a pasta' : 'o arquivo'}</strong>{' '}
              "<span className="font-mono">{fileToDelete.name}</span>"?
              {fileToDelete.type === 'folder' && (
                <span className="block mt-1 text-sm text-red-500">
                  Todos os arquivos dentro da pasta serão excluídos!
                </span>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelDelete}
                className={`px-4 py-2 rounded ${
                  isDarkMode
                    ? 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
