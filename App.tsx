import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CodeEditor } from './components/CodeEditor';
import { Toolbar } from './components/Toolbar';
import { SaveDialog, LoadDialog, RecoveryDialog } from './components/SaveLoadDialog';
import { EmbedDialog } from './components/EmbedDialog';
import { ImportDialog } from './components/ImportDialog';
import { ThemeSelector } from './components/ThemeSelector';
import { TemplateSelector } from './components/TemplateSelector';
import { ResizeHandle, usePanelResize } from './components/ResizeHandle';
import { Minimap } from './components/Minimap';
import { MobileTabBar, MobileTab } from './components/MobileTabBar';
import { TabBar } from './components/TabBar';
import { useIsMobile } from './hooks/useMediaQuery';
import { useTabs } from './hooks/useTabs';
import { detectOrientation, toggleOrientationInCode, INITIAL_CODE } from './utils/mermaidUtils';
import { themes, MermaidTheme, applyThemeToCode } from './utils/mermaidThemes';
import { getCodeFromUrl, copyShareUrl } from './utils/shareUtils';
import { DiagramTemplate } from './utils/diagramTemplates';
import { Orientation } from './types';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import * as d3 from "d3";
import { useExport } from './hooks/useExport';
import { useHistory } from './hooks/useHistory';
import { useDiagramStorage } from './hooks/useDiagramStorage';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

const App: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [orientation, setOrientation] = useState<Orientation>('TD');
  const [isDraggingNode, setIsDraggingNode] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Dialog states
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [showEmbedDialog, setShowEmbedDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Theme state
  const [currentTheme, setCurrentTheme] = useState<MermaidTheme>(themes[0]);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Minimap state
  const [showMinimap, setShowMinimap] = useState(true);

  // Share notification state
  const [shareNotification, setShareNotification] = useState<string | null>(null);

  // Mobile state
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<MobileTab>('editor');

  // Transform state for minimap
  const [transformState, setTransformState] = useState({ scale: 1, positionX: 0, positionY: 0 });

  // Preview container ref for fullscreen and dimensions
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  // Panel resize hook
  const { width: editorWidth, handleResize, handleResizeEnd } = usePanelResize(400, 250, 800);

  // SVG content ref for export
  const svgContentRef = useRef<string>('');

  // Check for code in URL on initial load
  const initialCode = React.useMemo(() => {
    const urlCode = getCodeFromUrl();
    return urlCode || INITIAL_CODE;
  }, []);

  // Tabs hook for managing multiple diagrams
  const tabs = useTabs(initialCode);

  // History hook for undo/redo (per active tab)
  const history = useHistory(tabs.activeTab.code);
  const code = history.value;

  // Sync history with active tab when tab changes
  useEffect(() => {
    history.clear(tabs.activeTab.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs.activeTabId]);

  // Ref for the zoom wrapper instance
  const transformComponentRef = useRef<ReactZoomPanPinchRef | null>(null);

  // Storage hook
  const storage = useDiagramStorage({
    code,
    onLoadDiagram: useCallback((newCode: string) => {
      history.clear(newCode);
      setRefreshKey(prev => prev + 1);
    }, [history]),
  });

  // Export hook
  const exportHook = useExport({
    getSvgContent: useCallback(() => svgContentRef.current || null, []),
    getCode: useCallback(() => code, [code]),
    onPrint: useCallback(() => {
      if (transformComponentRef.current) {
        transformComponentRef.current.resetTransform();
      }
      setTimeout(() => window.print(), 100);
    }, []),
  });

  // Show recovery dialog if there's recovered code
  useEffect(() => {
    if (storage.recoveredCode) {
      setShowRecoveryDialog(true);
    }
  }, [storage.recoveredCode]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Callbacks estáveis para evitar re-renders desnecessários
  const handleRenderError = React.useCallback((msg: string) => setError(msg), []);
  const handleRenderSuccess = React.useCallback(() => setError(null), []);

  // Callback to update SVG content ref
  const handleSvgUpdate = useCallback((svg: string) => {
    svgContentRef.current = svg;
  }, []);

  // Toggle Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Sync orientation state when code changes manually
  useEffect(() => {
    const currentDir = detectOrientation(code);
    setOrientation(currentDir);
  }, [code]);

  const handleCodeChange = React.useCallback((newCode: string) => {
    history.setValue(newCode);
    tabs.updateTabCode(tabs.activeTabId, newCode);
    setError(null);
  }, [history, tabs]);

  const handleToggleOrientation = () => {
    // Detecta orientação diretamente do código atual (evita estado dessincronizado)
    const currentDir = detectOrientation(code);
    const newCode = toggleOrientationInCode(code, currentDir);
    history.setValue(newCode);
    // Força refresh do componente para limpar cache do Mermaid
    setRefreshKey(prev => prev + 1);
  };

  const handlePrint = () => {
    if (transformComponentRef.current) {
      transformComponentRef.current.resetTransform();
    }
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Save/Load handlers
  const handleSave = useCallback(() => setShowSaveDialog(true), []);
  const handleLoad = useCallback(() => {
    storage.refresh();
    setShowLoadDialog(true);
  }, [storage]);

  const handleSaveConfirm = useCallback((name: string) => {
    storage.save(name);
    setShowSaveDialog(false);
  }, [storage]);

  // Recovery handlers
  const handleRecover = useCallback(() => {
    if (storage.recoveredCode) {
      history.clear(storage.recoveredCode);
      setRefreshKey(prev => prev + 1);
    }
    storage.clearRecoveredCode();
    setShowRecoveryDialog(false);
  }, [storage, history]);

  const handleDiscardRecovery = useCallback(() => {
    storage.clearRecoveredCode();
    setShowRecoveryDialog(false);
  }, [storage]);

  // Theme change handler
  const handleThemeChange = useCallback((theme: MermaidTheme) => {
    setCurrentTheme(theme);
    // Apply theme to current code
    const newCode = applyThemeToCode(code, theme);
    if (newCode !== code) {
      history.setValue(newCode);
      setRefreshKey(prev => prev + 1);
    }
  }, [code, history]);

  // Template selection handler
  const handleSelectTemplate = useCallback((template: DiagramTemplate) => {
    // Apply current theme to template code
    const themedCode = applyThemeToCode(template.code, currentTheme);
    history.clear(themedCode);
    setRefreshKey(prev => prev + 1);
  }, [currentTheme, history]);

  // Share handler
  const handleShare = useCallback(async () => {
    const success = await copyShareUrl(code);
    if (success) {
      setShareNotification('URL copiada para a \u00e1rea de transfer\u00eancia!');
      setTimeout(() => setShareNotification(null), 3000);
    } else {
      setShareNotification('Erro ao copiar URL');
      setTimeout(() => setShareNotification(null), 3000);
    }
  }, [code]);

  // Embed handler
  const handleEmbed = useCallback(() => {
    setShowEmbedDialog(true);
  }, []);

  // Import handler
  const handleImportClick = useCallback(() => {
    setShowImportDialog(true);
  }, []);

  const handleImportDiagram = useCallback((importedCode: string) => {
    handleCodeChange(importedCode);
    setRefreshKey(prev => prev + 1);
  }, [handleCodeChange]);

  // Fullscreen handlers
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && previewContainerRef.current) {
      previewContainerRef.current.requestFullscreen().catch(console.error);
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    }
  }, []);

  // Track fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Track container dimensions for minimap
  useEffect(() => {
    if (!previewContainerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(previewContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Track transform state for minimap
  const handleTransformChange = useCallback((ref: ReactZoomPanPinchRef) => {
    setTransformState({
      scale: ref.state.scale,
      positionX: ref.state.positionX,
      positionY: ref.state.positionY,
    });
  }, []);

  // Minimap navigation handler
  const handleMinimapNavigate = useCallback((x: number, y: number) => {
    if (transformComponentRef.current) {
      transformComponentRef.current.setTransform(x, y, transformState.scale);
    }
  }, [transformState.scale]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSave: handleSave,
    onUndo: history.undo,
    onRedo: history.redo,
    onToggleFullscreen: handleToggleFullscreen,
    onNewDiagram: useCallback(() => {
      history.clear(INITIAL_CODE);
      setRefreshKey(prev => prev + 1);
    }, [history]),
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-darker text-slate-900 dark:text-gray-100">
      
      <Toolbar
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onUpload={handleCodeChange}
        onPrint={handlePrint}
        onRefresh={handleRefresh}
        orientation={orientation}
        toggleOrientation={handleToggleOrientation}
        zoomIn={() => transformComponentRef.current?.zoomIn()}
        zoomOut={() => transformComponentRef.current?.zoomOut()}
        resetTransform={() => transformComponentRef.current?.resetTransform()}
        // Export
        onExportPng={exportHook.exportPng}
        onExportSvg={exportHook.exportSvg}
        onExportMarkdown={exportHook.exportMarkdown}
        onCopySvg={exportHook.copySvg}
        // Share
        onShare={handleShare}
        onEmbed={handleEmbed}
        // Import
        onImport={handleImportClick}
        // Persistence
        onSave={handleSave}
        onLoad={handleLoad}
        onUndo={history.undo}
        onRedo={history.redo}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        autoSaveEnabled={storage.autoSaveEnabled}
        onToggleAutoSave={storage.toggleAutoSave}
        // Theme & Templates
        themeSelector={
          <ThemeSelector
            currentThemeId={currentTheme.id}
            onThemeChange={handleThemeChange}
            isDarkMode={isDarkMode}
          />
        }
        templateSelector={
          <TemplateSelector
            onSelectTemplate={handleSelectTemplate}
            isDarkMode={isDarkMode}
          />
        }
        // Fullscreen & Minimap
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        showMinimap={showMinimap}
        onToggleMinimap={() => setShowMinimap(!showMinimap)}
        isMobile={isMobile}
      />

      {/* Diagram Tabs Bar */}
      {!isMobile && (
        <TabBar
          tabs={tabs.tabs}
          activeTabId={tabs.activeTabId}
          onSelectTab={tabs.selectTab}
          onCloseTab={tabs.closeTab}
          onAddTab={() => tabs.addTab()}
          onRenameTab={tabs.renameTab}
          canAddTab={tabs.canAddTab}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Mobile Tab Bar */}
      {isMobile && (
        <MobileTabBar
          activeTab={mobileTab}
          onTabChange={setMobileTab}
          isDarkMode={isDarkMode}
        />
      )}

      <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
        {/* Editor Section - hidden on mobile when preview tab is active */}
        <div
          className={`${isMobile ? (mobileTab === 'editor' ? 'flex-1' : 'hidden') : ''} h-1/2 md:h-full p-4 no-print flex flex-col`}
          style={!isMobile ? { width: `${editorWidth}px`, minWidth: '250px', maxWidth: '800px' } : undefined}
        >
          <CodeEditor
            code={code}
            onChange={handleCodeChange}
            isDarkMode={isDarkMode}
            error={error}
            onSave={handleSave}
            onUndo={history.undo}
            onRedo={history.redo}
          />
        </div>

        {/* Resize Handle - hidden on mobile */}
        {!isMobile && (
          <ResizeHandle
            onResize={handleResize}
            onResizeEnd={handleResizeEnd}
            isDarkMode={isDarkMode}
          />
        )}

        {/* Preview Section - hidden on mobile when editor tab is active */}
        <div
          ref={previewContainerRef}
          className={`${isMobile ? (mobileTab === 'preview' ? 'flex-1' : 'hidden') : 'flex-1'} h-1/2 md:h-full p-4 bg-gray-100 dark:bg-slate-900 relative`}
        >
          
          <div className="h-full w-full shadow-xl rounded-lg bg-white dark:bg-slate-800 overflow-hidden flex flex-col relative">
             <TransformWrapper
                ref={transformComponentRef}
                initialScale={1}
                minScale={0.1}
                maxScale={4}
                centerOnInit={true}
                limitToBounds={false}
                wheel={{ step: 0.1 }}
                doubleClick={{ disabled: true }}
                disabled={isDraggingNode}
                onTransformed={handleTransformChange}
              >
                <TransformComponent
                  wrapperStyle={{ width: "100%", height: "100%", overflow: "visible" }}
                  contentStyle={{ overflow: "visible" }}
                  wrapperClass="w-full h-full"
                  contentClass="flex items-center justify-center"
                >
                   <InnerMermaidRenderer
                     key={refreshKey}
                     code={code}
                     isDarkMode={isDarkMode}
                     onError={handleRenderError}
                     onSuccess={handleRenderSuccess}
                     setIsDraggingNode={setIsDraggingNode}
                     onCodeChange={handleCodeChange}
                     onSvgUpdate={handleSvgUpdate}
                   />
                </TransformComponent>
            </TransformWrapper>

            {/* Minimap */}
            {showMinimap && svgContentRef.current && (
              <Minimap
                svgContent={svgContentRef.current}
                scale={transformState.scale}
                positionX={transformState.positionX}
                positionY={transformState.positionY}
                containerWidth={containerDimensions.width}
                containerHeight={containerDimensions.height}
                isDarkMode={isDarkMode}
                onNavigate={handleMinimapNavigate}
              />
            )}

            {/* Fullscreen exit button */}
            {isFullscreen && (
              <button
                onClick={handleToggleFullscreen}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg z-50"
                title="Exit Fullscreen (Esc)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <SaveDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveConfirm}
        isDarkMode={isDarkMode}
      />
      <LoadDialog
        isOpen={showLoadDialog}
        onClose={() => setShowLoadDialog(false)}
        onLoad={storage.load}
        onDelete={storage.remove}
        diagrams={storage.diagrams}
        isDarkMode={isDarkMode}
      />
      <RecoveryDialog
        isOpen={showRecoveryDialog}
        onRecover={handleRecover}
        onDiscard={handleDiscardRecovery}
        isDarkMode={isDarkMode}
      />
      <EmbedDialog
        isOpen={showEmbedDialog}
        onClose={() => setShowEmbedDialog(false)}
        code={code}
        isDarkMode={isDarkMode}
      />
      <ImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={handleImportDiagram}
        isDarkMode={isDarkMode}
      />

      {/* Share notification toast */}
      {shareNotification && (
        <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          {shareNotification}
        </div>
      )}
    </div>
  );
};

// --- GEOMETRY HELPERS ---

// Get the BBox of a node including its current transform
const getNodeBBox = (node: Element) => {
  const el = node as any;
  const bbox = el.getBBox(); // Local coordinates (untransformed)
  const transform = d3.select(node).attr("transform");
  let tx = 0, ty = 0;
  
  if (transform) {
    // Handle translate(x,y) or translate(x)
    const match = /translate\(\s*([-\d.]+)[,\s]*([-\d.]*)\s*\)/.exec(transform);
    if (match) {
        tx = parseFloat(match[1]) || 0;
        ty = parseFloat(match[2]) || 0;
    }
  }

  const x = bbox.x + tx;
  const y = bbox.y + ty;
  
  return {
    x,
    y,
    width: bbox.width,
    height: bbox.height,
    cx: x + bbox.width / 2,
    cy: y + bbox.height / 2
  };
};

// Check if a point is close to a BBox
const isPointInBBox = (point: {x: number, y: number}, bbox: ReturnType<typeof getNodeBBox>) => {
  const tolerance = 20; // Increased tolerance
  return (
    point.x >= bbox.x - tolerance &&
    point.x <= bbox.x + bbox.width + tolerance &&
    point.y >= bbox.y - tolerance &&
    point.y <= bbox.y + bbox.height + tolerance
  );
};

// Calculate the intersection point between a line (from center to targetCenter) and the node's bounding box
const getIntersection = (rect: any, targetCenter: {cx: number, cy: number}) => {
    const dx = targetCenter.cx - rect.cx;
    const dy = targetCenter.cy - rect.cy;
    
    // If centers are the same, return center
    if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return { x: rect.cx, y: rect.cy };

    const w = rect.width / 2;
    const h = rect.height / 2;
    
    // Avoid division by zero
    if (dx === 0) return { x: rect.cx, y: rect.cy + (dy > 0 ? h : -h) };
    if (dy === 0) return { x: rect.cx + (dx > 0 ? w : -w), y: rect.cy };

    const tanTheta = Math.abs(dy / dx);
    const tanAlpha = h / w;

    let ix, iy;

    if (tanTheta < tanAlpha) {
        // Left or Right
        if (dx > 0) {
             ix = rect.cx + w;
             iy = rect.cy + w * (dy / dx);
        } else {
             ix = rect.cx - w;
             iy = rect.cy - w * (dy / dx);
        }
    } else {
        // Top or Bottom
        if (dy > 0) {
            iy = rect.cy + h;
            ix = rect.cx + h * (dx / dy);
        } else {
            iy = rect.cy - h;
            ix = rect.cx - h * (dx / dy);
        }
    }
    
    return { x: ix, y: iy };
};

// Contador global para IDs únicos
let globalRenderCounter = 0;

// Extrai o nome da classe/nó do elemento SVG (fora do componente para evitar recriação)
const extractNodeName = (nodeElement: Element): string => {
  // Para classDiagram, o nome está em .classTitle ou em text elements
  const classTitle = nodeElement.querySelector('.classTitle');
  if (classTitle) {
    return classTitle.textContent?.trim() || '';
  }

  // Para flowchart/graph, o texto está em .nodeLabel ou spans
  const nodeLabel = nodeElement.querySelector('.nodeLabel');
  if (nodeLabel) {
    return nodeLabel.textContent?.trim() || '';
  }

  // Fallback: procura qualquer texto
  const textEl = nodeElement.querySelector('text, span');
  if (textEl) {
    return textEl.textContent?.trim() || '';
  }

  return '';
};

// Interface para estado de edição inline
interface EditState {
  isEditing: boolean;
  originalName: string;
  currentValue: string;
  position: { x: number; y: number };
  nodeElement: Element | null;
}

const InnerMermaidRenderer: React.FC<import('./types').PreviewProps> = ({
  code,
  isDarkMode,
  onError,
  onSuccess,
  setIsDraggingNode,
  onCodeChange,
  onSvgUpdate
}) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditingRef = useRef<boolean>(false);

  // Notify parent of SVG content changes for export
  useEffect(() => {
    if (onSvgUpdate && svgContent) {
      onSvgUpdate(svgContent);
    }
  }, [svgContent, onSvgUpdate]);

  const [editState, setEditState] = useState<EditState>({
    isEditing: false,
    originalName: '',
    currentValue: '',
    position: { x: 0, y: 0 },
    nodeElement: null
  });

  // Renderiza quando code ou isDarkMode mudam
  useEffect(() => {
    let cancelled = false;

    const renderDiagram = async () => {
      if (!code.trim()) {
        setSvgContent('');
        return;
      }

      // Limpa TODOS os elementos mermaid do DOM
      document.querySelectorAll('[id^="mermaid"]').forEach(el => el.remove());
      document.querySelectorAll('[id^="dmermaid"]').forEach(el => el.remove());
      document.querySelectorAll('.mermaid').forEach(el => {
        if (!containerRef.current?.contains(el)) el.remove();
      });

      // Reimporta mermaid fresh a cada render (nuclear option)
      const mermaid = await import('mermaid');
      const mermaidInstance = mermaid.default;

      if (cancelled) return;

      // Tenta resetar qualquer estado interno do Mermaid
      try {
        if (mermaidInstance.mermaidAPI?.reset) {
          mermaidInstance.mermaidAPI.reset();
        }
        if ((mermaidInstance as any).reset) {
          (mermaidInstance as any).reset();
        }
        // Limpa diagrams registry se existir
        if ((mermaidInstance as any).diagrams) {
          (mermaidInstance as any).diagrams = {};
        }
      } catch (e) {
        // Ignora erros de reset
      }

      // Inicializa com configuração limpa
      mermaidInstance.initialize({
        startOnLoad: false,
        theme: isDarkMode ? 'dark' : 'default',
        securityLevel: 'loose',
      });

      try {
        globalRenderCounter += 1;
        const id = `mermaid${globalRenderCounter}`;

        // Para classDiagram, usa init directive para forçar re-render completo
        let codeToRender = code;
        if (code.trim().toLowerCase().startsWith('classdiagram')) {
          const hasLR = /direction\s+LR/i.test(code);
          const direction = hasLR ? 'LR' : 'TB';
          // Usa timestamp + counter para garantir que cada render seja único
          const cacheBuster = `${globalRenderCounter}_${Date.now()}`;
          const initDirective = `%%{init: {'flowchart': {'diagramPadding': ${cacheBuster.length}}, 'themeVariables': {'cacheBust': '${cacheBuster}'}}}%%\n`;
          codeToRender = initDirective + code.replace(/direction\s+(TD|TB|LR|RL)/gi, `direction ${direction}`);
        }

        const { svg } = await mermaidInstance.render(id, codeToRender);

        if (cancelled) return;

        // Adjust SVG to prevent clipping - remove fixed dimensions and add overflow visible
        const adjustedSvg = svg
          .replace(/(<svg[^>]*)\s+width="[^"]*"/gi, '$1')
          .replace(/(<svg[^>]*)\s+height="[^"]*"/gi, '$1')
          .replace(/(<svg[^>]*)\s+style="[^"]*"/gi, '$1 style="overflow: visible; max-width: none;"')
          .replace(/(<svg)([^>]*>)/gi, (match, p1, p2) => {
            if (!match.includes('style=')) {
              return `${p1} style="overflow: visible; max-width: none;"${p2}`;
            }
            return match;
          });

        setSvgContent(adjustedSvg);
        onSuccess();
      } catch (e: any) {
        if (cancelled) return;
        const msg = e.message || "Erro de sintaxe no diagrama";
        onError(msg);
      }
    };

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [code, isDarkMode, onError, onSuccess]);

  // Salva a edição e atualiza o código
  const handleSaveEdit = () => {
    if (!editState.isEditing || !editState.originalName) return;

    const newName = editState.currentValue.trim();
    if (newName && newName !== editState.originalName) {
      // Escapa caracteres especiais para regex
      const escapedOriginal = editState.originalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Substitui todas as ocorrências do nome original pelo novo nome
      // Usa word boundary para não substituir partes de outras palavras
      const regex = new RegExp(`\\b${escapedOriginal}\\b`, 'g');
      const newCode = code.replace(regex, newName);
      onCodeChange(newCode);
    }

    setEditState({
      isEditing: false,
      originalName: '',
      currentValue: '',
      position: { x: 0, y: 0 },
      nodeElement: null
    });
  };

  // Cancela a edição
  const handleCancelEdit = () => {
    setEditState({
      isEditing: false,
      originalName: '',
      currentValue: '',
      position: { x: 0, y: 0 },
      nodeElement: null
    });
  };

  // Focus no input quando começar a editar (com delay para evitar blur imediato)
  useEffect(() => {
    if (editState.isEditing && inputRef.current) {
      // Pequeno delay para garantir que o input está renderizado
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [editState.isEditing]);

  // Atualiza ref quando editState muda
  useEffect(() => {
    isEditingRef.current = editState.isEditing;
  }, [editState.isEditing]);

  // D3 Logic
  useEffect(() => {
    if (!containerRef.current || !svgContent) return;

    const div = d3.select(containerRef.current);
    const svg = div.select("svg");
    if (svg.empty()) return;

    const nodes = svg.selectAll(".node");
    // Select path elements directly under .edgePaths (handles different mermaid versions)
    const edges = svg.selectAll(".edgePaths path"); 
    const labels = svg.selectAll(".edgeLabels .edgeLabel");
    
    const edgeMeta: { 
        edgeEl: any; 
        labelEl: any;
        sourceNode: any; 
        targetNode: any;
    }[] = [];

    const nodeData = nodes.nodes().map((n: any) => ({
        element: n,
        bbox: getNodeBBox(n)
    }));

    edges.each(function(d, i) {
        const path = d3.select(this); // 'this' is the path element itself now
        const dAttr = path.attr("d");
        if (!dAttr) return;

        const numbers = dAttr.match(/-?\d+(\.\d+)?/g)?.map(parseFloat);
        if (!numbers || numbers.length < 4) return;

        const startX = numbers[0];
        const startY = numbers[1];
        const endX = numbers[numbers.length - 2];
        const endY = numbers[numbers.length - 1];

        let bestStartNode = null;
        let bestEndNode = null;
        let minStartDist = Infinity;
        let minEndDist = Infinity;

        nodeData.forEach(nd => {
            // Check Start
            const distStart = Math.hypot(nd.bbox.cx - startX, nd.bbox.cy - startY);
            // Prioritize containment, then distance
            const inStart = isPointInBBox({x: startX, y: startY}, nd.bbox);
            
            if (inStart || distStart < minStartDist) {
                // If we found a contained one, it wins unless we find another contained one (rare overlap)
                // If neither contained, closest wins
                if (inStart) {
                     bestStartNode = nd.element;
                     minStartDist = -1; // Flag as found inside
                } else if (minStartDist !== -1) {
                     minStartDist = distStart;
                     bestStartNode = nd.element;
                }
            }

            // Check End
            const distEnd = Math.hypot(nd.bbox.cx - endX, nd.bbox.cy - endY);
            const inEnd = isPointInBBox({x: endX, y: endY}, nd.bbox);
            
            if (inEnd || distEnd < minEndDist) {
                if (inEnd) {
                    bestEndNode = nd.element;
                    minEndDist = -1;
                } else if (minEndDist !== -1) {
                    minEndDist = distEnd;
                    bestEndNode = nd.element;
                }
            }
        });

        // Filter out bad matches (distance too far if not contained)
        if (minStartDist > 200 && minStartDist !== -1) bestStartNode = null;
        if (minEndDist > 200 && minEndDist !== -1) bestEndNode = null;

        if (bestStartNode && bestEndNode) {
            // Calcular ponto médio da edge para encontrar label por proximidade
            const edgeMidX = (startX + endX) / 2;
            const edgeMidY = (startY + endY) / 2;

            // Encontrar o label mais próximo do ponto médio da edge
            let closestLabel: any = null;
            let minLabelDist = Infinity;

            labels.each(function() {
                const labelNode = this as SVGGElement;
                const labelTransform = d3.select(labelNode).attr("transform");
                let labelX = 0, labelY = 0;

                if (labelTransform) {
                    const match = /translate\(\s*([-\d.]+)[,\s]*([-\d.]*)\s*\)/.exec(labelTransform);
                    if (match) {
                        labelX = parseFloat(match[1]) || 0;
                        labelY = parseFloat(match[2]) || 0;
                    }
                }

                const dist = Math.hypot(labelX - edgeMidX, labelY - edgeMidY);
                if (dist < minLabelDist) {
                    minLabelDist = dist;
                    closestLabel = labelNode;
                }
            });

            // Só associa se o label estiver razoavelmente próximo
            const labelEl = minLabelDist < 150 ? closestLabel : null;

            edgeMeta.push({
                edgeEl: path,
                labelEl: labelEl,
                sourceNode: bestStartNode,
                targetNode: bestEndNode
            });
        }
    });

    const updateConnectedEdges = (node: any) => {
        const relevantEdges = edgeMeta.filter(e => e.sourceNode === node || e.targetNode === node);
        
        relevantEdges.forEach(item => {
            const sourceBBox = getNodeBBox(item.sourceNode);
            const targetBBox = getNodeBBox(item.targetNode);

            if (item.sourceNode === item.targetNode) return;

            const startPoint = getIntersection(sourceBBox, { cx: targetBBox.cx, cy: targetBBox.cy });
            const endPoint = getIntersection(targetBBox, { cx: sourceBBox.cx, cy: sourceBBox.cy });

            const newD = `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;
            item.edgeEl.attr("d", newD);

            if (item.labelEl) {
                const midX = (startPoint.x + endPoint.x) / 2;
                const midY = (startPoint.y + endPoint.y) / 2;

                // Obter dimensões do label para centralizar corretamente
                const labelBBox = (item.labelEl as SVGGElement).getBBox();
                const labelWidth = labelBBox.width;
                const labelHeight = labelBBox.height;

                // Centralizar o label no ponto médio da edge
                const centeredX = midX - labelWidth / 2;
                const centeredY = midY - labelHeight / 2;

                d3.select(item.labelEl).attr("transform", `translate(${centeredX}, ${centeredY})`);
            }
        });
    };

    const dragBehavior = d3.drag()
      .on("start", function() {
        d3.select(this).raise().classed("active", true).style("cursor", "grabbing");
        setIsDraggingNode(true);
      })
      .on("drag", function(event: any) {
        const node = d3.select(this);
        const transform = node.attr("transform");
        let currentX = 0, currentY = 0;
        
        if (transform) {
          const match = /translate\(\s*([-\d.]+)[,\s]*([-\d.]*)\s*\)/.exec(transform);
          if (match) {
            currentX = parseFloat(match[1]) || 0;
            currentY = parseFloat(match[2]) || 0;
          }
        }

        const newX = currentX + event.dx;
        const newY = currentY + event.dy;
        node.attr("transform", `translate(${newX}, ${newY})`);
        
        updateConnectedEdges(this);
      })
      .on("end", function() {
        d3.select(this).classed("active", false).style("cursor", "grab");
        setIsDraggingNode(false);
      });

    nodes.style("cursor", "grab").call(dragBehavior as any);

    // Double-click para editar nome do nó
    nodes.on("dblclick", function(event: any) {
      event.stopPropagation();
      event.preventDefault();

      // Ignora se já estiver editando
      if (isEditingRef.current) return;

      const nodeElement = this as Element;
      const nodeName = extractNodeName(nodeElement);

      if (!nodeName) return;

      // Calcula posição do input baseado no elemento
      const rect = nodeElement.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();

      if (!containerRect) return;

      const x = rect.left - containerRect.left + rect.width / 2;
      const y = rect.top - containerRect.top + rect.height / 2;

      setEditState({
        isEditing: true,
        originalName: nodeName,
        currentValue: nodeName,
        position: { x, y },
        nodeElement
      });
    });

  }, [svgContent, setIsDraggingNode]);

  if (!svgContent) {
    return <div className="text-gray-400">Gerando visualização...</div>;
  }

  return (
    <div className="relative" style={{ overflow: 'visible' }}>
      <div
        ref={containerRef}
        className="flex items-center justify-center"
        style={{ overflow: 'visible' }}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />

      {/* Input overlay para edição inline */}
      {editState.isEditing && (
        <div
          className="absolute z-50"
          style={{
            left: editState.position.x,
            top: editState.position.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={editState.currentValue}
            onChange={(e) => setEditState(prev => ({ ...prev, currentValue: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveEdit();
              } else if (e.key === 'Escape') {
                handleCancelEdit();
              }
            }}
            onBlur={() => {
              // Delay para evitar blur acidental ao abrir
              setTimeout(() => {
                if (editState.isEditing) {
                  handleSaveEdit();
                }
              }, 150);
            }}
            className="px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border-2 border-blue-500 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[150px]"
            style={{ minWidth: Math.max(150, editState.currentValue.length * 10) }}
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
            Enter: salvar | Esc: cancelar
          </div>
        </div>
      )}
    </div>
  );
};

export default App;