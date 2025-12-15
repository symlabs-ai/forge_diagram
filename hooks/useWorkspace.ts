import { useState, useCallback, useRef, useEffect } from 'react';
import { FileNode, Workspace, SearchResult } from '../types';
import {
  isFileSystemAccessSupported,
  openDirectory,
  readDirectoryRecursive,
  readFileContent,
  writeFileContent,
  processUploadedFiles,
  searchInFiles
} from '../utils/fileSystemUtils';

const WORKSPACE_STORAGE_KEY = 'forge-draw-workspace';
const WORKSPACE_HANDLE_DB = 'forge-draw-workspace-handle';

interface UseWorkspaceReturn {
  workspace: Workspace | null;
  isLoading: boolean;
  error: string | null;
  isSupported: boolean;
  openFolder: () => Promise<void>;
  openFolderFallback: (files: FileList) => Promise<void>;
  closeWorkspace: () => void;
  refreshFiles: () => Promise<void>;
  readFile: (file: FileNode) => Promise<string>;
  writeFile: (file: FileNode, content: string) => Promise<void>;
  searchFiles: (query: string) => Promise<SearchResult[]>;
  getFileByPath: (path: string) => FileNode | null;
  reopenLastWorkspace: () => Promise<boolean>;
  hasStoredWorkspace: boolean;
}

// Cache for file contents
const contentCache = new Map<string, string>();

// IndexedDB helpers for storing directory handles
async function openHandleDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(WORKSPACE_HANDLE_DB, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('handles')) {
        db.createObjectStore('handles');
      }
    };
  });
}

async function storeDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    const db = await openHandleDB();
    const tx = db.transaction('handles', 'readwrite');
    const store = tx.objectStore('handles');
    store.put(handle, 'workspace');
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) {
    console.error('Failed to store directory handle:', e);
  }
}

async function getStoredDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openHandleDB();
    const tx = db.transaction('handles', 'readonly');
    const store = tx.objectStore('handles');
    const request = store.get('workspace');
    const handle = await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return handle;
  } catch (e) {
    console.error('Failed to get stored directory handle:', e);
    return null;
  }
}

async function clearStoredDirectoryHandle(): Promise<void> {
  try {
    const db = await openHandleDB();
    const tx = db.transaction('handles', 'readwrite');
    const store = tx.objectStore('handles');
    store.delete('workspace');
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) {
    console.error('Failed to clear directory handle:', e);
  }
}

// Serialize FileNode for storage (without handles)
function serializeFileNode(node: FileNode): FileNode {
  const serialized: FileNode = {
    name: node.name,
    path: node.path,
    type: node.type,
  };
  if (node.content !== undefined) {
    serialized.content = node.content;
  }
  if (node.children) {
    serialized.children = node.children.map(serializeFileNode);
  }
  return serialized;
}

// Save virtual workspace to localStorage
function saveVirtualWorkspace(workspace: Workspace): void {
  try {
    const toSave = {
      name: workspace.name,
      rootPath: workspace.rootPath,
      files: workspace.files.map(serializeFileNode),
      isVirtual: true,
    };
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('Failed to save virtual workspace:', e);
  }
}

// Save workspace metadata (for File System Access API workspaces)
function saveWorkspaceMetadata(workspace: Workspace): void {
  try {
    const toSave = {
      name: workspace.name,
      rootPath: workspace.rootPath,
      isVirtual: false,
    };
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('Failed to save workspace metadata:', e);
  }
}

// Load stored workspace info
function getStoredWorkspaceInfo(): { name: string; isVirtual: boolean } | null {
  try {
    const stored = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { name: parsed.name, isVirtual: parsed.isVirtual };
    }
  } catch (e) {
    console.error('Failed to load workspace info:', e);
  }
  return null;
}

// Load virtual workspace from localStorage
function loadVirtualWorkspace(): Workspace | null {
  try {
    const stored = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.isVirtual) {
        return {
          name: parsed.name,
          rootPath: parsed.rootPath,
          files: parsed.files,
          isVirtual: true,
        };
      }
    }
  } catch (e) {
    console.error('Failed to load virtual workspace:', e);
  }
  return null;
}

// Clear stored workspace
function clearStoredWorkspace(): void {
  localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  clearStoredDirectoryHandle();
}

export function useWorkspace(): UseWorkspaceReturn {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasStoredWorkspace, setHasStoredWorkspace] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initialLoadDone = useRef(false);

  const isSupported = isFileSystemAccessSupported();

  // Check for stored workspace on mount and auto-restore
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    const autoRestore = async () => {
      const storedInfo = getStoredWorkspaceInfo();
      console.log('[useWorkspace] Stored info:', storedInfo);

      if (!storedInfo) return;

      // Auto-restore virtual workspaces
      if (storedInfo.isVirtual) {
        const virtualWorkspace = loadVirtualWorkspace();
        console.log('[useWorkspace] Virtual workspace loaded:', !!virtualWorkspace);
        if (virtualWorkspace) {
          setWorkspace(virtualWorkspace);
        }
        return;
      }

      // Auto-restore File System Access API workspaces
      if (isSupported) {
        console.log('[useWorkspace] Attempting auto-restore of File System workspace');
        setIsLoading(true);

        try {
          const handle = await getStoredDirectoryHandle();
          if (!handle) {
            console.log('[useWorkspace] No stored handle found');
            setHasStoredWorkspace(true); // Show button as fallback
            setIsLoading(false);
            return;
          }

          // Try to get permission (may show prompt)
          const permission = await handle.requestPermission({ mode: 'readwrite' });
          if (permission !== 'granted') {
            console.log('[useWorkspace] Permission denied, showing button');
            setHasStoredWorkspace(true); // Show button as fallback
            setIsLoading(false);
            return;
          }

          const files = await readDirectoryRecursive(handle);
          console.log('[useWorkspace] Auto-restored workspace:', handle.name);

          setWorkspace({
            name: handle.name,
            rootPath: handle.name,
            files,
            handle,
            isVirtual: false
          });

          contentCache.clear();
        } catch (e) {
          console.error('[useWorkspace] Auto-restore failed:', e);
          setHasStoredWorkspace(true); // Show button as fallback
        } finally {
          setIsLoading(false);
        }
      }
    };

    autoRestore();
  }, [isSupported]);

  // Reopen last workspace (for File System Access API)
  const reopenLastWorkspace = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    const storedInfo = getStoredWorkspaceInfo();
    if (!storedInfo || storedInfo.isVirtual) return false;

    setIsLoading(true);
    setError(null);

    try {
      const handle = await getStoredDirectoryHandle();
      if (!handle) {
        setIsLoading(false);
        return false;
      }

      // Request permission
      const permission = await handle.requestPermission({ mode: 'readwrite' });
      if (permission !== 'granted') {
        setError('Permission denied to access folder');
        setIsLoading(false);
        return false;
      }

      const files = await readDirectoryRecursive(handle);

      setWorkspace({
        name: handle.name,
        rootPath: handle.name,
        files,
        handle,
        isVirtual: false
      });

      setHasStoredWorkspace(false);
      contentCache.clear();
      return true;
    } catch (e) {
      setError((e as Error).message);
      // Clear invalid stored handle
      clearStoredWorkspace();
      setHasStoredWorkspace(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Open folder using File System Access API
  const openFolder = useCallback(async () => {
    if (!isSupported) {
      setError('File System Access API not supported in this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const handle = await openDirectory();
      if (!handle) {
        setIsLoading(false);
        return; // User cancelled
      }

      const files = await readDirectoryRecursive(handle);

      const newWorkspace: Workspace = {
        name: handle.name,
        rootPath: handle.name,
        files,
        handle,
        isVirtual: false
      };

      setWorkspace(newWorkspace);

      // Store handle and metadata for persistence
      console.log('[useWorkspace] Storing handle and metadata for:', newWorkspace.name);
      await storeDirectoryHandle(handle);
      saveWorkspaceMetadata(newWorkspace);
      console.log('[useWorkspace] Saved metadata to localStorage');
      setHasStoredWorkspace(false);

      contentCache.clear();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Open folder fallback (file input with webkitdirectory)
  const openFolderFallback = useCallback(async (files: FileList) => {
    if (files.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const fileNodes = await processUploadedFiles(files);

      // Get root folder name from first file's path
      const firstPath = (files[0] as any).webkitRelativePath || files[0].name;
      const rootName = firstPath.split('/')[0] || 'Workspace';

      const newWorkspace: Workspace = {
        name: rootName,
        rootPath: rootName,
        files: fileNodes,
        isVirtual: true
      };

      setWorkspace(newWorkspace);

      // Save virtual workspace to localStorage
      saveVirtualWorkspace(newWorkspace);
      setHasStoredWorkspace(false);

      contentCache.clear();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Close workspace
  const closeWorkspace = useCallback(() => {
    setWorkspace(null);
    clearStoredWorkspace();
    setHasStoredWorkspace(false);
    contentCache.clear();
    setError(null);
  }, []);

  // Refresh file list
  const refreshFiles = useCallback(async () => {
    if (!workspace || !workspace.handle) return;

    setIsLoading(true);
    try {
      const files = await readDirectoryRecursive(workspace.handle);
      setWorkspace(prev => prev ? { ...prev, files } : null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [workspace]);

  // Read file content
  const readFile = useCallback(async (file: FileNode): Promise<string> => {
    // Check cache first
    if (contentCache.has(file.path)) {
      return contentCache.get(file.path)!;
    }

    // For virtual workspace, content is already in the node
    if (file.content !== undefined) {
      contentCache.set(file.path, file.content);
      return file.content;
    }

    // For File System Access API
    if (file.handle && 'getFile' in file.handle) {
      const content = await readFileContent(file.handle as FileSystemFileHandle);
      contentCache.set(file.path, content);
      return content;
    }

    throw new Error(`Cannot read file: ${file.path}`);
  }, []);

  // Write file content
  const writeFile = useCallback(async (file: FileNode, content: string): Promise<void> => {
    // For virtual workspace, just update cache and file node
    if (workspace?.isVirtual) {
      contentCache.set(file.path, content);
      file.content = content;

      // Update saved workspace
      saveVirtualWorkspace(workspace);
      return;
    }

    // For File System Access API
    if (file.handle && 'createWritable' in file.handle) {
      await writeFileContent(file.handle as FileSystemFileHandle, content);
      contentCache.set(file.path, content);
      return;
    }

    throw new Error(`Cannot write file: ${file.path}`);
  }, [workspace]);

  // Search in files
  const searchFiles = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!workspace || !query.trim()) return [];

    return searchInFiles(workspace.files, query, readFile);
  }, [workspace, readFile]);

  // Get file by path
  const getFileByPath = useCallback((path: string): FileNode | null => {
    if (!workspace) return null;

    const findInNodes = (nodes: FileNode[]): FileNode | null => {
      for (const node of nodes) {
        if (node.path === path) return node;
        if (node.children) {
          const found = findInNodes(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    return findInNodes(workspace.files);
  }, [workspace]);

  return {
    workspace,
    isLoading,
    error,
    isSupported,
    openFolder,
    openFolderFallback,
    closeWorkspace,
    refreshFiles,
    readFile,
    writeFile,
    searchFiles,
    getFileByPath,
    reopenLastWorkspace,
    hasStoredWorkspace,
  };
}
