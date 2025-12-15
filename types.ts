export interface MermaidError {
  hash: string;
  message: string;
  str: string;
}

export type Orientation = 'TD' | 'LR';

export interface EditorProps {
  code: string;
  onChange: (code: string) => void;
  error: string | null;
}

export interface NodeTransform {
  nodeId: string;
  x: number;
  y: number;
}

export interface PreviewProps {
  code: string;
  isDarkMode: boolean;
  onError: (error: string) => void;
  onSuccess: () => void;
  setIsDraggingNode: (isDragging: boolean) => void;
  onCodeChange: (newCode: string) => void;
  onSvgUpdate?: (svg: string) => void;
  onDragStart?: (svgElement: SVGSVGElement | null) => void;
  applyTransformsRef?: React.MutableRefObject<((transforms: NodeTransform[]) => void) | null>;
  restoreSvgSnapshotRef?: React.MutableRefObject<((svgHTML: string) => void) | null>;
}

export interface ToolbarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onPrint: () => void;
  onRefresh?: () => void;
  orientation: Orientation;
  toggleOrientation: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  onRedraw: () => void;
  // Export
  onExportPng: () => void;
  onExportSvg: () => void;
  onExportMarkdown: () => void;
  onCopySvg: () => void;
  // Share
  onShare: () => void;
  onEmbed: () => void;
  // Persistence
  onSave: () => void;
  onLoad: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  autoSaveEnabled: boolean;
  onToggleAutoSave: () => void;
  // Theme & Templates
  themeSelector?: React.ReactNode;
  templateSelector?: React.ReactNode;
  // Fullscreen
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  // Minimap
  showMinimap?: boolean;
  onToggleMinimap?: () => void;
  // Mobile
  isMobile?: boolean;
}

// Export types
export type ExportFormat = 'png' | 'svg' | 'pdf';

// Persistence types
export interface SavedDiagram {
  id: string;
  name: string;
  code: string;
  createdAt: number;
  updatedAt: number;
}

export interface DiagramHistory {
  past: string[];
  present: string;
  future: string[];
}

export interface AppSettings {
  autoSave: boolean;
  autoSaveInterval: number;
  maxHistorySize: number;
}

// Tab system types
export type TabType = 'diagram' | 'markdown';

export interface DiagramTab {
  id: string;
  name: string;
  code: string;
  isDirty: boolean;
  createdAt: number;
  type: TabType; // 'diagram' for mermaid/plantuml, 'markdown' for .md files
  filePath?: string; // Optional path if opened from workspace
}

export interface TabsState {
  tabs: DiagramTab[];
  activeTabId: string;
}

export const MAX_TABS = 10;

export interface DiagramStorage {
  version: number;
  diagrams: SavedDiagram[];
}

// Workspace/File Explorer types
export type ActivityView = 'explorer' | 'search' | 'diagrams' | 'settings';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  handle?: FileSystemFileHandle | FileSystemDirectoryHandle;
  content?: string; // Cached content for virtual workspace
}

export interface Workspace {
  name: string;
  rootPath: string;
  files: FileNode[];
  handle?: FileSystemDirectoryHandle;
  isVirtual: boolean; // true = upload fallback, false = File System Access API
}

export interface SearchResult {
  file: FileNode;
  line: number;
  content: string;
  matchStart: number;
  matchEnd: number;
}

// Supported file extensions for workspace
export const SUPPORTED_EXTENSIONS = ['.mmd', '.mermaid', '.md', '.puml', '.plantuml'];