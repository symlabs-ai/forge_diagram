import React, { useCallback, useRef, useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  width: number;
  onWidthChange: (width: number) => void;
  isDarkMode: boolean;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  width,
  onWidthChange,
  isDarkMode,
  title,
  children,
  actions
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      onWidthChange(startWidth + delta);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [width, onWidthChange]);

  if (!isOpen) return null;

  return (
    <div
      ref={sidebarRef}
      className={`flex flex-col h-full border-r relative ${
        isDarkMode
          ? 'bg-slate-800 border-slate-700'
          : 'bg-white border-gray-200'
      }`}
      style={{ width: `${width}px`, minWidth: '150px', maxWidth: '500px' }}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-2 border-b ${
          isDarkMode ? 'border-slate-700' : 'border-gray-200'
        }`}
      >
        <h3
          className={`text-xs font-semibold uppercase tracking-wider ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          {title}
        </h3>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>

      {/* Resize handle - inside sidebar to avoid overflow clipping */}
      <div
        className={`absolute top-0 right-0 h-full cursor-ew-resize transition-colors z-50 ${
          isResizing ? 'bg-indigo-500' : 'hover:bg-indigo-400/30'
        }`}
        style={{
          width: '8px',
        }}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};
