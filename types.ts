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

export interface PreviewProps {
  code: string;
  isDarkMode: boolean;
  onError: (error: string) => void;
  onSuccess: () => void;
  setIsDraggingNode: (isDragging: boolean) => void;
  onCodeChange: (newCode: string) => void;
  onSvgUpdate?: (svg: string) => void;
}

export interface ToolbarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onUpload: (content: string) => void;
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
  // Import
  onImport: () => void;
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
export interface DiagramTab {
  id: string;
  name: string;
  code: string;
  isDirty: boolean;
  createdAt: number;
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