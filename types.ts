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
}

export interface ToolbarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onUpload: (content: string) => void;
  onPrint: () => void;
  orientation: Orientation;
  toggleOrientation: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetTransform: () => void;
}