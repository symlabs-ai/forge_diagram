import React from 'react';
import { Orientation } from '../types'; // Assuming types.ts is in the root directory

interface ToolbarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onUpload: (code: string) => void;
  onPrint: () => void;
  onRefresh: () => void;
  orientation: Orientation;
  toggleOrientation: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetTransform: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  isDarkMode,
  toggleDarkMode,
  onUpload,
  onPrint,
  onRefresh,
  orientation,
  toggleOrientation,
  zoomIn,
  zoomOut,
  resetTransform,
}) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onUpload(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex items-center justify-between p-2 bg-gray-200 dark:bg-slate-700 shadow-md no-print">
      <div className="flex items-center space-x-2">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded hover:bg-gray-300 dark:hover:bg-slate-600"
          title="Toggle Dark Mode"
        >
          {isDarkMode ? '🌞' : '🌙'}
        </button>
        <button
          onClick={toggleOrientation}
          className="p-2 rounded hover:bg-gray-300 dark:hover:bg-slate-600"
          title={`Toggle Orientation (Current: ${orientation})`}
        >
          ↕️
        </button>
        <input
          type="file"
          accept=".mermaid,.mmd,.txt"
          onChange={handleFileUpload}
          className="hidden"
          id="upload-file"
        />
        <label
          htmlFor="upload-file"
          className="p-2 rounded hover:bg-gray-300 dark:hover:bg-slate-600 cursor-pointer"
          title="Upload Mermaid File"
        >
          ⬆️
        </label>
        <button
          onClick={onPrint}
          className="p-2 rounded hover:bg-gray-300 dark:hover:bg-slate-600"
          title="Print Diagram"
        >
          🖨️
        </button>
        <button
          onClick={onRefresh}
          className="p-2 rounded hover:bg-gray-300 dark:hover:bg-slate-600"
          title="Refresh Diagram"
        >
          🔃
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={zoomIn}
          className="p-2 rounded hover:bg-gray-300 dark:hover:bg-slate-600"
          title="Zoom In"
        >
          ➕
        </button>
        <button
          onClick={zoomOut}
          className="p-2 rounded hover:bg-gray-300 dark:hover:bg-slate-600"
          title="Zoom Out"
        >
          ➖
        </button>
        <button
          onClick={resetTransform}
          className="p-2 rounded hover:bg-gray-300 dark:hover:bg-slate-600"
          title="Reset Zoom/Pan"
        >
          🔄
        </button>
      </div>
    </div>
  );
};
