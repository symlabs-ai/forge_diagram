import { useEffect, useRef, useCallback, useState } from 'react';
import { FileNode } from '../types';

interface WatchedFile {
  path: string;
  handle: FileSystemFileHandle;
  lastModified: number;
  size: number;
}

interface FileChangeInfo {
  path: string;
  handle: FileSystemFileHandle;
  hasUnsavedChanges: boolean;
}

interface UseFileWatcherOptions {
  // Callback when a file changes externally and has no unsaved changes (auto-reload)
  onFileChanged: (path: string, newContent: string) => void;
  // Callback when a file changes externally but has unsaved changes (show dialog)
  onFileConflict: (info: FileChangeInfo) => void;
  // Function to check if a file has unsaved changes
  hasUnsavedChanges: (path: string) => boolean;
  // Polling interval in ms (0 to disable polling, only check on focus)
  pollingInterval?: number;
  // Enable/disable the watcher
  enabled?: boolean;
}

interface UseFileWatcherReturn {
  // Register a file to be watched
  watchFile: (file: FileNode) => void;
  // Unregister a file from watching
  unwatchFile: (path: string) => void;
  // Update the lastModified after saving (to avoid false positives)
  markFileSaved: (path: string) => void;
  // Manually check for changes
  checkForChanges: () => Promise<void>;
  // Number of files being watched
  watchedCount: number;
}

export function useFileWatcher(options: UseFileWatcherOptions): UseFileWatcherReturn {
  const {
    onFileChanged,
    onFileConflict,
    hasUnsavedChanges,
    pollingInterval = 0,
    enabled = true,
  } = options;

  const watchedFilesRef = useRef<Map<string, WatchedFile>>(new Map());
  const [watchedCount, setWatchedCount] = useState(0);
  const isCheckingRef = useRef(false);

  // Store callbacks in refs to avoid re-creating effects
  const onFileChangedRef = useRef(onFileChanged);
  const onFileConflictRef = useRef(onFileConflict);
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);

  useEffect(() => {
    onFileChangedRef.current = onFileChanged;
    onFileConflictRef.current = onFileConflict;
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [onFileChanged, onFileConflict, hasUnsavedChanges]);

  // Get file metadata (lastModified, size)
  const getFileMetadata = useCallback(async (handle: FileSystemFileHandle): Promise<{ lastModified: number; size: number } | null> => {
    try {
      const file = await handle.getFile();
      return {
        lastModified: file.lastModified,
        size: file.size,
      };
    } catch (e) {
      console.error('[FileWatcher] Error getting file metadata:', e);
      return null;
    }
  }, []);

  // Check if a specific file has changed
  const checkFile = useCallback(async (watched: WatchedFile): Promise<boolean> => {
    const metadata = await getFileMetadata(watched.handle);
    if (!metadata) return false;

    // File changed if lastModified or size is different
    return metadata.lastModified !== watched.lastModified || metadata.size !== watched.size;
  }, [getFileMetadata]);

  // Check all watched files for changes
  const checkForChanges = useCallback(async () => {
    if (!enabled || isCheckingRef.current) return;

    isCheckingRef.current = true;

    try {
      const watchedFiles: WatchedFile[] = Array.from(watchedFilesRef.current.values());

      for (const watched of watchedFiles) {
        const hasChanged = await checkFile(watched);

        if (hasChanged) {
          console.log('[FileWatcher] File changed externally:', watched.path);

          const unsaved = hasUnsavedChangesRef.current(watched.path);

          if (unsaved) {
            // File has unsaved changes - show conflict dialog
            onFileConflictRef.current({
              path: watched.path,
              handle: watched.handle,
              hasUnsavedChanges: true,
            });
          } else {
            // No unsaved changes - auto-reload
            try {
              const file = await watched.handle.getFile();
              const newContent = await file.text();

              // Update watched metadata
              watchedFilesRef.current.set(watched.path, {
                ...watched,
                lastModified: file.lastModified,
                size: file.size,
              });

              onFileChangedRef.current(watched.path, newContent);
            } catch (e) {
              console.error('[FileWatcher] Error reading changed file:', e);
            }
          }
        }
      }
    } finally {
      isCheckingRef.current = false;
    }
  }, [enabled, checkFile]);

  // Watch a file
  const watchFile = useCallback((file: FileNode) => {
    if (!file.handle || !('getFile' in file.handle)) {
      console.warn('[FileWatcher] Cannot watch file (no handle - File System Access API not supported or virtual workspace):', file.path);
      return; // Can only watch files with File System Access API handles
    }

    const handle = file.handle as FileSystemFileHandle;

    // Get initial metadata
    getFileMetadata(handle).then(metadata => {
      if (metadata) {
        watchedFilesRef.current.set(file.path, {
          path: file.path,
          handle,
          lastModified: metadata.lastModified,
          size: metadata.size,
        });
        setWatchedCount(watchedFilesRef.current.size);
        console.log('[FileWatcher] Now watching:', file.path);
      }
    });
  }, [getFileMetadata]);

  // Unwatch a file
  const unwatchFile = useCallback((path: string) => {
    watchedFilesRef.current.delete(path);
    setWatchedCount(watchedFilesRef.current.size);
    console.log('[FileWatcher] Stopped watching:', path);
  }, []);

  // Mark file as saved (update lastModified to current)
  const markFileSaved = useCallback(async (path: string) => {
    const watched = watchedFilesRef.current.get(path);
    if (!watched) return;

    const metadata = await getFileMetadata(watched.handle);
    if (metadata) {
      watchedFilesRef.current.set(path, {
        ...watched,
        lastModified: metadata.lastModified,
        size: metadata.size,
      });
      console.log('[FileWatcher] Updated metadata after save:', path);
    }
  }, [getFileMetadata]);

  // Check for changes when window gains focus
  useEffect(() => {
    if (!enabled) return;

    const handleFocus = () => {
      console.log('[FileWatcher] Window focused, checking for changes...');
      checkForChanges();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[FileWatcher] Tab visible, checking for changes...');
        checkForChanges();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, checkForChanges]);

  // Optional polling
  useEffect(() => {
    if (!enabled || pollingInterval <= 0) return;

    const interval = setInterval(checkForChanges, pollingInterval);
    return () => clearInterval(interval);
  }, [enabled, pollingInterval, checkForChanges]);

  return {
    watchFile,
    unwatchFile,
    markFileSaved,
    checkForChanges,
    watchedCount,
  };
}
