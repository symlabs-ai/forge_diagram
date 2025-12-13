import { useEffect, useCallback } from 'react';

interface KeyboardShortcuts {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onToggleFullscreen?: () => void;
  onExitFullscreen?: () => void;
  onToggleDarkMode?: () => void;
  onNewDiagram?: () => void;
  onOpenDiagram?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
}

/**
 * Hook para gerenciar atalhos de teclado globais
 * Atalhos disponíveis:
 * - Ctrl+S: Salvar
 * - Ctrl+Z: Undo
 * - Ctrl+Y / Ctrl+Shift+Z: Redo
 * - F11: Toggle Fullscreen
 * - Escape: Exit Fullscreen
 * - Ctrl+D: Toggle Dark Mode
 * - Ctrl+N: Novo diagrama
 * - Ctrl+O: Abrir diagrama
 * - Ctrl+=: Zoom In
 * - Ctrl+-: Zoom Out
 * - Ctrl+0: Reset Zoom
 */
export function useKeyboardShortcuts({
  onSave,
  onUndo,
  onRedo,
  onToggleFullscreen,
  onExitFullscreen,
  onToggleDarkMode,
  onNewDiagram,
  onOpenDiagram,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: KeyboardShortcuts) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const isModKey = event.ctrlKey || event.metaKey;
    const isInEditor = (event.target as HTMLElement)?.closest('.cm-editor');

    // F11 - Toggle Fullscreen (funciona em qualquer lugar)
    if (event.key === 'F11') {
      event.preventDefault();
      onToggleFullscreen?.();
      return;
    }

    // Escape - Exit Fullscreen
    if (event.key === 'Escape' && document.fullscreenElement) {
      onExitFullscreen?.();
      return;
    }

    // Atalhos de zoom - SEMPRE intercepta para sobrepor o browser
    // Mesmo dentro do editor, queremos controlar o zoom do diagrama
    if (isModKey) {
      const key = event.key.toLowerCase();
      if (key === '=' || key === '+' || event.key === '+') {
        event.preventDefault();
        event.stopPropagation();
        onZoomIn?.();
        return;
      }
      if (key === '-' || event.key === '-') {
        event.preventDefault();
        event.stopPropagation();
        onZoomOut?.();
        return;
      }
      if (key === '0') {
        event.preventDefault();
        event.stopPropagation();
        onResetZoom?.();
        return;
      }
    }

    // Se estiver no CodeMirror, deixa ele lidar com a maioria dos atalhos
    // Exceto os que queremos capturar globalmente
    if (isInEditor) {
      // Ctrl+S - Salvar (captura mesmo no editor)
      if (isModKey && event.key === 's') {
        event.preventDefault();
        onSave?.();
        return;
      }
      // Outros atalhos são tratados pelo CodeMirror
      return;
    }

    // Atalhos fora do editor
    if (isModKey) {
      switch (event.key.toLowerCase()) {
        case 's':
          event.preventDefault();
          onSave?.();
          break;
        case 'z':
          if (event.shiftKey) {
            event.preventDefault();
            onRedo?.();
          } else {
            event.preventDefault();
            onUndo?.();
          }
          break;
        case 'y':
          event.preventDefault();
          onRedo?.();
          break;
        case 'd':
          event.preventDefault();
          onToggleDarkMode?.();
          break;
        case 'n':
          event.preventDefault();
          onNewDiagram?.();
          break;
        case 'o':
          event.preventDefault();
          onOpenDiagram?.();
          break;
      }
    }
  }, [
    onSave,
    onUndo,
    onRedo,
    onToggleFullscreen,
    onExitFullscreen,
    onToggleDarkMode,
    onNewDiagram,
    onOpenDiagram,
    onZoomIn,
    onZoomOut,
    onResetZoom,
  ]);

  useEffect(() => {
    // capture: true para interceptar antes do browser processar os atalhos
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [handleKeyDown]);
}

/**
 * Hook para detectar teclas específicas (útil para componentes individuais)
 */
export function useKeyPress(targetKey: string, callback: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [targetKey, callback]);
}
