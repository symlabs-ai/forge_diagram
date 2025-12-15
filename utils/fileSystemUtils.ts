/**
 * File System Access API utilities for workspace management
 */

import { FileNode, SUPPORTED_EXTENSIONS } from '../types';

// Check if File System Access API is supported
export function isFileSystemAccessSupported(): boolean {
  return 'showDirectoryPicker' in window;
}

// Check if a file has a supported extension
export function isSupportedFile(name: string): boolean {
  const lowerName = name.toLowerCase();
  return SUPPORTED_EXTENSIONS.some(ext => lowerName.endsWith(ext));
}

// Get file extension
export function getFileExtension(name: string): string {
  const lastDot = name.lastIndexOf('.');
  return lastDot >= 0 ? name.substring(lastDot) : '';
}

// Open directory picker (File System Access API)
export async function openDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) return null;

  try {
    return await (window as any).showDirectoryPicker({
      mode: 'readwrite'
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') return null;
    throw e;
  }
}

// Read directory recursively
export async function readDirectoryRecursive(
  dirHandle: FileSystemDirectoryHandle,
  path = '',
  maxDepth = 10
): Promise<FileNode[]> {
  if (maxDepth <= 0) return [];

  const entries: FileNode[] = [];

  try {
    for await (const [name, handle] of (dirHandle as any).entries()) {
      // Skip hidden files and folders
      if (name.startsWith('.')) continue;

      const fullPath = path ? `${path}/${name}` : name;

      if (handle.kind === 'directory') {
        const children = await readDirectoryRecursive(
          handle as FileSystemDirectoryHandle,
          fullPath,
          maxDepth - 1
        );
        // Only include folders that have supported files
        if (children.length > 0 || maxDepth > 5) {
          entries.push({
            name,
            path: fullPath,
            type: 'folder',
            children,
            handle: handle as FileSystemDirectoryHandle
          });
        }
      } else if (isSupportedFile(name)) {
        entries.push({
          name,
          path: fullPath,
          type: 'file',
          handle: handle as FileSystemFileHandle
        });
      }
    }
  } catch (e) {
    console.error('Error reading directory:', path, e);
  }

  // Sort: folders first, then alphabetically
  return entries.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

// Read file content
export async function readFileContent(handle: FileSystemFileHandle): Promise<string> {
  const file = await handle.getFile();
  return await file.text();
}

// Write file content
export async function writeFileContent(
  handle: FileSystemFileHandle,
  content: string
): Promise<void> {
  const writable = await (handle as any).createWritable();
  await writable.write(content);
  await writable.close();
}

// Create new file in directory
export async function createFile(
  dirHandle: FileSystemDirectoryHandle,
  fileName: string
): Promise<FileSystemFileHandle> {
  return await (dirHandle as any).getFileHandle(fileName, { create: true });
}

// Delete file from directory
export async function deleteFile(
  dirHandle: FileSystemDirectoryHandle,
  fileName: string
): Promise<void> {
  await (dirHandle as any).removeEntry(fileName);
}

// Process uploaded files (fallback for browsers without File System Access API)
export async function processUploadedFiles(files: FileList): Promise<FileNode[]> {
  const fileNodes: FileNode[] = [];
  const folderMap = new Map<string, FileNode>();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const relativePath = (file as any).webkitRelativePath || file.name;

    if (!isSupportedFile(file.name)) continue;

    const parts = relativePath.split('/');
    const fileName = parts.pop()!;

    // Read file content
    const content = await file.text();

    // Build folder structure
    let currentPath = '';
    let parentChildren = fileNodes;

    for (const folderName of parts) {
      const folderPath = currentPath ? `${currentPath}/${folderName}` : folderName;

      if (!folderMap.has(folderPath)) {
        const folderNode: FileNode = {
          name: folderName,
          path: folderPath,
          type: 'folder',
          children: []
        };
        parentChildren.push(folderNode);
        folderMap.set(folderPath, folderNode);
      }

      const folder = folderMap.get(folderPath)!;
      parentChildren = folder.children!;
      currentPath = folderPath;
    }

    // Add file
    const filePath = currentPath ? `${currentPath}/${fileName}` : fileName;
    parentChildren.push({
      name: fileName,
      path: filePath,
      type: 'file',
      content // Store content for virtual workspace
    });
  }

  // Sort recursively
  const sortNodes = (nodes: FileNode[]): FileNode[] => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(node => {
      if (node.children) {
        node.children = sortNodes(node.children);
      }
    });
    return nodes;
  };

  return sortNodes(fileNodes);
}

// Search in files
export async function searchInFiles(
  files: FileNode[],
  query: string,
  getContent: (file: FileNode) => Promise<string>
): Promise<{ file: FileNode; line: number; content: string; matchStart: number; matchEnd: number }[]> {
  const results: { file: FileNode; line: number; content: string; matchStart: number; matchEnd: number }[] = [];
  const lowerQuery = query.toLowerCase();

  const searchInNode = async (node: FileNode) => {
    if (node.type === 'folder' && node.children) {
      for (const child of node.children) {
        await searchInNode(child);
      }
    } else if (node.type === 'file') {
      try {
        const content = await getContent(node);
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          const lowerLine = line.toLowerCase();
          let pos = 0;

          while ((pos = lowerLine.indexOf(lowerQuery, pos)) !== -1) {
            results.push({
              file: node,
              line: index + 1,
              content: line.trim(),
              matchStart: pos,
              matchEnd: pos + query.length
            });
            pos += query.length;
          }
        });
      } catch (e) {
        console.error('Error searching file:', node.path, e);
      }
    }
  };

  for (const file of files) {
    await searchInNode(file);
  }

  return results;
}

// Get icon for file type
export function getFileIcon(fileName: string): string {
  const ext = getFileExtension(fileName).toLowerCase();
  switch (ext) {
    case '.mmd':
    case '.mermaid':
      return 'diagram';
    case '.md':
      return 'markdown';
    case '.puml':
    case '.plantuml':
      return 'plantuml';
    default:
      return 'file';
  }
}
