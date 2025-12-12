import React, { useCallback, useEffect, useState } from 'react';

interface ResizeHandleProps {
  onResize: (deltaX: number) => void;
  onResizeEnd?: () => void;
  isDarkMode: boolean;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  onResize,
  onResizeEnd,
  isDarkMode,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    let lastX = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (lastX !== 0) {
        const deltaX = e.clientX - lastX;
        onResize(deltaX);
      }
      lastX = e.clientX;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onResizeEnd?.();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Adiciona classe ao body para cursor consistente
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, onResize, onResizeEnd]);

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`w-1 cursor-col-resize transition-colors flex-shrink-0 group relative ${
        isDragging
          ? 'bg-blue-500'
          : isDarkMode
            ? 'bg-slate-700 hover:bg-blue-500'
            : 'bg-gray-300 hover:bg-blue-500'
      }`}
    >
      {/* Área de toque maior para facilitar o uso */}
      <div className="absolute inset-y-0 -left-1 -right-1" />

      {/* Indicador visual no centro */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className={`flex flex-col gap-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          <div className="w-1 h-1 rounded-full bg-current" />
          <div className="w-1 h-1 rounded-full bg-current" />
          <div className="w-1 h-1 rounded-full bg-current" />
        </div>
      </div>
    </div>
  );
};

/**
 * Hook para gerenciar o estado de redimensionamento de painéis
 */
export function usePanelResize(initialWidth: number, minWidth: number = 200, maxWidth: number = 800) {
  const [width, setWidth] = useState(initialWidth);

  const handleResize = useCallback((deltaX: number) => {
    setWidth(prev => Math.min(maxWidth, Math.max(minWidth, prev + deltaX)));
  }, [minWidth, maxWidth]);

  const handleResizeEnd = useCallback(() => {
    // Salva preferência no localStorage
    localStorage.setItem('mermaid-pro-viz-editor-width', String(width));
  }, [width]);

  // Carrega preferência salva
  useEffect(() => {
    const saved = localStorage.getItem('mermaid-pro-viz-editor-width');
    if (saved) {
      const savedWidth = parseInt(saved, 10);
      if (!isNaN(savedWidth) && savedWidth >= minWidth && savedWidth <= maxWidth) {
        setWidth(savedWidth);
      }
    }
  }, [minWidth, maxWidth]);

  return { width, handleResize, handleResizeEnd, setWidth };
}
