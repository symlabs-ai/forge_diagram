import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CodeEditor } from './components/CodeEditor';
import { Toolbar } from './components/Toolbar';
import { SaveDialog, LoadDialog, RecoveryDialog } from './components/SaveLoadDialog';
import { EmbedDialog } from './components/EmbedDialog';
import { ShareDialog } from './components/ShareDialog';
import { ThemeSelector } from './components/ThemeSelector';
import { TemplateSelector } from './components/TemplateSelector';
import { MarkdownThemeSelector } from './components/MarkdownThemeSelector';
import { markdownThemes, MarkdownTheme, getMarkdownThemeById } from './utils/markdownThemes';
import { ResizeHandle, usePanelResize } from './components/ResizeHandle';
import { Minimap } from './components/Minimap';
import { MobileTabBar, MobileTab } from './components/MobileTabBar';
import { TabBar } from './components/TabBar';
import { ActivityBar } from './components/ActivityBar';
import { Sidebar } from './components/Sidebar';
import { FileExplorer } from './components/FileExplorer';
import { SearchPanel } from './components/SearchPanel';
import { MarkdownPreview } from './components/MarkdownPreview';
import { useIsMobile } from './hooks/useMediaQuery';
import { useTabs } from './hooks/useTabs';
import { useActivityBar } from './hooks/useActivityBar';
import { useWorkspace } from './hooks/useWorkspace';
import { detectOrientation, toggleOrientationInCode, INITIAL_CODE } from './utils/mermaidUtils';
import { themes, MermaidTheme, applyThemeToCode } from './utils/mermaidThemes';
import { getCodeFromUrl, copyShareUrl } from './utils/shareUtils';
import { isPlantUML, renderPlantUML } from './utils/plantumlUtils';
import { DiagramTemplate } from './utils/diagramTemplates';
import { Orientation, ActivityView, FileNode } from './types';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import * as d3 from "d3";
import { useExport } from './hooks/useExport';
import { useHistory } from './hooks/useHistory';
import { useDiagramStorage } from './hooks/useDiagramStorage';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useVisualHistory, NodeTransform } from './hooks/useVisualHistory';

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
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Theme state
  const [currentTheme, setCurrentTheme] = useState<MermaidTheme>(themes[0]);

  // Markdown theme state
  const [markdownTheme, setMarkdownTheme] = useState<MarkdownTheme>(markdownThemes[0]);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Minimap state
  const [showMinimap, setShowMinimap] = useState(true);

  // Editor panel collapsed state
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);

  // Share notification state
  const [shareNotification, setShareNotification] = useState<string | null>(null);

  // Mobile state
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<MobileTab>('preview');

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

  // Activity bar and workspace hooks
  const activityBar = useActivityBar();
  const workspace = useWorkspace();
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

  // Handle file selection from explorer
  const handleFileSelect = useCallback(async (file: FileNode) => {
    if (file.type !== 'file') return;

    try {
      const content = await workspace.readFile(file);
      setSelectedFilePath(file.path);

      // Detect file type based on extension
      const isMarkdown = /\.md$/i.test(file.name);
      const tabType = isMarkdown ? 'markdown' : 'diagram';

      // Open file in a new tab or update current tab
      const existingTab = tabs.tabs.find(t => t.name === file.name);
      if (existingTab) {
        tabs.selectTab(existingTab.id);
      } else {
        tabs.addTab({
          code: content,
          type: tabType,
          name: file.name,
          filePath: file.path,
        });
      }
    } catch (e) {
      console.error('Error opening file:', e);
    }
  }, [workspace, tabs]);

  // Handle search result click
  const handleSearchResultClick = useCallback(async (file: FileNode, line: number) => {
    await handleFileSelect(file);
    // TODO: scroll to line in editor
  }, [handleFileSelect]);

  // Listen for URL hash changes (for PWA shared links)
  useEffect(() => {
    const handleHashChange = () => {
      const urlCode = getCodeFromUrl();
      if (urlCode && urlCode !== tabs.activeTab.code) {
        // Create a new tab with the shared diagram
        tabs.addTab(urlCode);
        setRefreshKey(prev => prev + 1);
      }
    };

    // Check when app gains focus (PWA coming to foreground)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleHashChange();
      }
    };

    // Check on focus (alternative for some browsers)
    const handleFocus = () => {
      handleHashChange();
    };

    window.addEventListener('hashchange', handleHashChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [tabs]);

  // History hook for undo/redo (per active tab)
  const history = useHistory(tabs.activeTab.code || '');
  const code = history.value || '';

  // Visual history for node positions (drag operations)
  const visualHistory = useVisualHistory();

  // Ref to store function for applying transforms to SVG nodes
  const applyTransformsRef = useRef<((transforms: NodeTransform[]) => void) | null>(null);

  // Ref to store function for restoring SVG snapshot
  const restoreSvgSnapshotRef = useRef<((svgHTML: string) => void) | null>(null);

  // Track last action type for unified undo/redo
  const lastActionRef = useRef<'code' | 'visual'>('code');

  // Sync history with active tab when tab changes
  useEffect(() => {
    // Ensure code is always a valid string
    const tabCode = tabs.activeTab.code || '';
    history.clear(tabCode);
    visualHistory.clear();
    // eslint-disable-next-line react-hooks-deps
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
    console.log('[DEBUG] handleCodeChange called, newCode length:', newCode.length);
    history.setValue(newCode);
    console.log('[DEBUG] after setValue, canUndo:', history.canUndo);
    tabs.updateTabCode(tabs.activeTabId, newCode);
    lastActionRef.current = 'code';
    setError(null);
  }, [history, tabs]);

  // Handler for visual state changes (drag start - saves SVG snapshot BEFORE the change)
  const handleVisualStateSave = useCallback((svgElement: SVGSVGElement | null) => {
    if (!svgElement) {
      console.log('[DEBUG] handleVisualStateSave called with null SVG');
      return;
    }
    const svgHTML = svgElement.outerHTML;
    console.log('[DEBUG] handleVisualStateSave saving SVG snapshot, length:', svgHTML.length);
    visualHistory.pushSnapshot(svgHTML);
    lastActionRef.current = 'visual';
  }, [visualHistory.pushSnapshot]);

  // Get current SVG HTML for redo support
  const getCurrentSvgHtml = useCallback((): string | null => {
    const container = document.querySelector('.react-transform-component svg');
    return container ? (container as SVGSVGElement).outerHTML : null;
  }, []);

  // Unified undo handler
  const handleUndo = useCallback(() => {
    console.log('[DEBUG] handleUndo called');
    console.log('[DEBUG] lastAction:', lastActionRef.current);
    console.log('[DEBUG] history.canUndo:', history.canUndo);
    console.log('[DEBUG] visualHistory.canUndo:', visualHistory.canUndo);

    // Check which history to undo based on what's available
    if (lastActionRef.current === 'visual' && visualHistory.canUndo) {
      console.log('[DEBUG] Undoing visual snapshot');
      // Save current state for redo before undoing
      const currentSvg = getCurrentSvgHtml();
      if (currentSvg) {
        visualHistory.pushSnapshotToFuture(currentSvg);
      }
      const snapshot = visualHistory.undoSnapshot();
      if (snapshot && restoreSvgSnapshotRef.current) {
        console.log('[DEBUG] Restoring SVG snapshot from', new Date(snapshot.timestamp).toISOString());
        restoreSvgSnapshotRef.current(snapshot.svgInnerHTML);
      }
      // Check if we should switch to code history next
      if (!visualHistory.canUndo && history.canUndo) {
        lastActionRef.current = 'code';
      }
    } else if (history.canUndo) {
      console.log('[DEBUG] Undoing code');
      history.undo();
      lastActionRef.current = 'code';
    } else if (visualHistory.canUndo) {
      console.log('[DEBUG] Undoing visual snapshot (fallback)');
      // Save current state for redo before undoing
      const currentSvg = getCurrentSvgHtml();
      if (currentSvg) {
        visualHistory.pushSnapshotToFuture(currentSvg);
      }
      const snapshot = visualHistory.undoSnapshot();
      if (snapshot && restoreSvgSnapshotRef.current) {
        restoreSvgSnapshotRef.current(snapshot.svgInnerHTML);
      }
    } else {
      console.log('[DEBUG] Nothing to undo');
    }
  }, [history, visualHistory, getCurrentSvgHtml]);

  // Unified redo handler
  const handleRedo = useCallback(() => {
    console.log('[DEBUG] handleRedo called');
    console.log('[DEBUG] history.canRedo:', history.canRedo);
    console.log('[DEBUG] visualHistory.canRedo:', visualHistory.canRedo);

    if (visualHistory.canRedo) {
      console.log('[DEBUG] Redoing visual snapshot');
      // Save current state for undo before redoing (use pushSnapshotToPast to not clear future)
      const currentSvg = getCurrentSvgHtml();
      if (currentSvg) {
        visualHistory.pushSnapshotToPast(currentSvg);
      }
      const snapshot = visualHistory.redoSnapshot();
      if (snapshot && restoreSvgSnapshotRef.current) {
        console.log('[DEBUG] Restoring SVG snapshot from', new Date(snapshot.timestamp).toISOString());
        restoreSvgSnapshotRef.current(snapshot.svgInnerHTML);
      }
      lastActionRef.current = 'visual';
    } else if (history.canRedo) {
      console.log('[DEBUG] Redoing code');
      history.redo();
      lastActionRef.current = 'code';
    } else {
      console.log('[DEBUG] Nothing to redo');
    }
  }, [history, visualHistory, getCurrentSvgHtml]);

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

  // Share handler - opens share dialog
  const handleShare = useCallback(() => {
    setShowShareDialog(true);
  }, []);

  // Embed handler
  const handleEmbed = useCallback(() => {
    setShowEmbedDialog(true);
  }, []);

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

  // Redraw handler - re-renders the diagram to restore original layout while preserving zoom
  const handleRedraw = useCallback(() => {
    // Save current transform state from the tracked state
    const currentScale = transformState.scale;
    const currentX = transformState.positionX;
    const currentY = transformState.positionY;

    // Trigger re-render
    setRefreshKey(prev => prev + 1);

    // Restore transform after re-render
    setTimeout(() => {
      if (transformComponentRef.current) {
        transformComponentRef.current.setTransform(currentX, currentY, currentScale);
      }
    }, 100);
  }, [transformState]);

  // Combined canUndo/canRedo considering both histories
  const canUndo = history.canUndo || visualHistory.canUndo;
  const canRedo = history.canRedo || visualHistory.canRedo;

  // Debug: log canUndo changes
  useEffect(() => {
    console.log('[DEBUG] canUndo changed:', canUndo, '(history:', history.canUndo, ', visual:', visualHistory.canUndo, ') - lastAction:', lastActionRef.current);
  }, [canUndo, history.canUndo, visualHistory.canUndo]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSave: handleSave,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onToggleFullscreen: handleToggleFullscreen,
    onNewDiagram: useCallback(() => {
      history.clear(INITIAL_CODE);
      visualHistory.clear();
      setRefreshKey(prev => prev + 1);
    }, [history, visualHistory]),
    onZoomIn: useCallback(() => transformComponentRef.current?.zoomIn(), []),
    onZoomOut: useCallback(() => transformComponentRef.current?.zoomOut(), []),
    onResetZoom: useCallback(() => transformComponentRef.current?.resetTransform(), []),
    onToggleEditor: useCallback(() => setIsEditorCollapsed(prev => !prev), []),
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-darker text-slate-900 dark:text-gray-100">
      
      <Toolbar
        mode={tabs.activeTab?.type === 'markdown' ? 'markdown' : 'diagram'}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onPrint={handlePrint}
        onRefresh={handleRefresh}
        orientation={orientation}
        toggleOrientation={handleToggleOrientation}
        zoomIn={() => transformComponentRef.current?.zoomIn()}
        zoomOut={() => transformComponentRef.current?.zoomOut()}
        onRedraw={handleRedraw}
        // Export
        onExportPng={exportHook.exportPng}
        onExportSvg={exportHook.exportSvg}
        onExportMarkdown={exportHook.exportMarkdown}
        onCopySvg={exportHook.copySvg}
        // Share
        onShare={handleShare}
        onEmbed={handleEmbed}
        // Persistence
        onSave={handleSave}
        onLoad={handleLoad}
        onOpenFolder={workspace.openFolder}
        // Theme & Templates (diagram mode)
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
        // Markdown theme (markdown mode)
        markdownThemeSelector={
          <MarkdownThemeSelector
            currentThemeId={markdownTheme.id}
            onThemeChange={setMarkdownTheme}
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

      {/* Diagram Tabs Bar - wrapper with fixed height to prevent shrinking */}
      {!isMobile && (
        <div className="h-7 flex-shrink-0 flex-grow-0">
          <TabBar
            tabs={tabs.tabs}
            activeTabId={tabs.activeTabId}
            onSelectTab={tabs.selectTab}
            onCloseTab={tabs.closeTab}
            onAddTab={(type) => tabs.addTab({ type })}
            onRenameTab={tabs.renameTab}
            canAddTab={tabs.canAddTab}
            isDarkMode={isDarkMode}
          />
        </div>
      )}

      {/* Mobile Tab Bar */}
      {isMobile && (
        <MobileTabBar
          activeTab={mobileTab}
          onTabChange={setMobileTab}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Main content area with Activity Bar and Sidebar */}
      <div className="flex-grow flex overflow-hidden">
        {/* Activity Bar - desktop only */}
        {!isMobile && (
          <ActivityBar
            activeView={activityBar.activeView}
            onViewChange={activityBar.setActiveView}
            isDarkMode={isDarkMode}
            isSidebarOpen={activityBar.isSidebarOpen}
          />
        )}

        {/* Sidebar - desktop only */}
        {!isMobile && (
          <Sidebar
            isOpen={activityBar.isSidebarOpen}
            width={activityBar.sidebarWidth}
            onWidthChange={activityBar.setSidebarWidth}
            isDarkMode={isDarkMode}
            title={
              activityBar.activeView === 'explorer' ? 'Explorer' :
              activityBar.activeView === 'search' ? 'Buscar' :
              activityBar.activeView === 'diagrams' ? 'Diagramas' :
              'Configurações'
            }
          >
            {activityBar.activeView === 'explorer' && (
              <FileExplorer
                workspace={workspace.workspace}
                isLoading={workspace.isLoading}
                selectedPath={selectedFilePath}
                isDarkMode={isDarkMode}
                onFileSelect={handleFileSelect}
                onOpenFolder={workspace.openFolder}
                onOpenFolderFallback={workspace.openFolderFallback}
                onCloseWorkspace={workspace.closeWorkspace}
                onRefresh={workspace.refreshFiles}
                hasStoredWorkspace={workspace.hasStoredWorkspace}
                onReopenLastWorkspace={workspace.reopenLastWorkspace}
              />
            )}
            {activityBar.activeView === 'search' && (
              <SearchPanel
                workspace={workspace.workspace}
                isDarkMode={isDarkMode}
                onSearch={workspace.searchFiles}
                onResultClick={handleSearchResultClick}
              />
            )}
            {activityBar.activeView === 'diagrams' && (
              <div className={`p-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <p>Diagramas salvos aparecerão aqui.</p>
                <button
                  onClick={handleLoad}
                  className={`mt-2 px-3 py-1.5 rounded text-sm ${
                    isDarkMode
                      ? 'bg-slate-700 hover:bg-slate-600'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Abrir diagramas salvos
                </button>
              </div>
            )}
            {activityBar.activeView === 'settings' && (
              <div className={`p-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Auto-save</span>
                    <button
                      onClick={storage.toggleAutoSave}
                      className={`px-2 py-1 rounded text-xs ${
                        storage.autoSaveEnabled
                          ? 'bg-green-500 text-white'
                          : isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
                      }`}
                    >
                      {storage.autoSaveEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Minimap</span>
                    <button
                      onClick={() => setShowMinimap(!showMinimap)}
                      className={`px-2 py-1 rounded text-xs ${
                        showMinimap
                          ? 'bg-green-500 text-white'
                          : isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
                      }`}
                    >
                      {showMinimap ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Sidebar>
        )}

        {/* Main Editor/Preview area */}
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
          {/* Editor Section - collapsible on desktop, tab-based on mobile */}
        <div
          className={`
            ${isMobile ? (mobileTab === 'editor' ? 'flex-1' : 'hidden') : ''}
            h-1/2 md:h-full no-print flex flex-col flex-shrink-0
            transition-[width,padding,opacity] duration-300 ease-in-out
            ${!isMobile && isEditorCollapsed ? 'w-0 min-w-0 !p-0 overflow-hidden opacity-0' : 'p-4 opacity-100'}
          `}
          style={!isMobile && !isEditorCollapsed ? { width: `${editorWidth}px`, minWidth: '250px', maxWidth: '800px' } : undefined}
        >
          <CodeEditor
            code={code}
            onChange={handleCodeChange}
            isDarkMode={isDarkMode}
            error={error}
            onSave={handleSave}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />
        </div>

        {/* Editor Toggle Button - desktop only */}
        {!isMobile && (
          <button
            onClick={() => setIsEditorCollapsed(!isEditorCollapsed)}
            className={`
              flex-shrink-0 w-6 h-full flex items-center justify-center
              bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600
              border-x border-gray-300 dark:border-slate-600
              transition-colors duration-200 no-print
              group
            `}
            title={isEditorCollapsed ? "Show Editor (Ctrl+E)" : "Hide Editor (Ctrl+E)"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-transform duration-300 ${isEditorCollapsed ? 'rotate-180' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        {/* Resize Handle - hidden on mobile and when editor collapsed */}
        {!isMobile && !isEditorCollapsed && (
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
            {/* Markdown Preview - for markdown tabs */}
            {tabs.activeTab.type === 'markdown' ? (
              <MarkdownPreview
                content={code}
                isDarkMode={isDarkMode}
                theme={markdownTheme}
              />
            ) : (
              /* Diagram Preview - for diagram tabs */
              <>
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
                    wrapperStyle={{ width: "100%", height: "100%" }}
                    contentStyle={{ width: "100%", height: "100%" }}
                    wrapperClass="w-full h-full"
                    contentClass="w-full h-full flex items-center justify-center"
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
                       onDragStart={handleVisualStateSave}
                       applyTransformsRef={applyTransformsRef}
                       restoreSvgSnapshotRef={restoreSvgSnapshotRef}
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
              </>
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
        onOpenFile={handleCodeChange}
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
      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        code={code}
        isDarkMode={isDarkMode}
        onExportPng={exportHook.exportPng}
        onExportSvg={exportHook.exportSvg}
        onExportMarkdown={exportHook.exportMarkdown}
        onCopySvg={exportHook.copySvg}
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

// Detect node shape type from Mermaid classes and SVG structure
const getNodeShape = (node: Element): 'rectangle' | 'diamond' | 'circle' | 'default' => {
  const classList = node.classList;

  // Check for polygon-based shapes (diamonds in flowcharts)
  const polygon = node.querySelector('polygon');
  if (polygon) {
    const points = polygon.getAttribute('points');
    if (points) {
      // Parse points to check if it's a diamond (4 vertices forming a rhombus)
      const pointPairs = points.trim().split(/\s+/).filter(p => p.includes(','));
      if (pointPairs.length === 4) {
        // Check if it's a rhombus by verifying the shape
        // A diamond has vertices at top, right, bottom, left
        return 'diamond';
      }
    }
  }

  // Check for path-based diamonds (some Mermaid versions use path instead of polygon)
  const pathEl = node.querySelector('path.label-container');
  if (pathEl) {
    const d = pathEl.getAttribute('d');
    // Diamond paths typically have 4 line segments
    if (d && (d.match(/L/g) || []).length >= 3) {
      return 'diamond';
    }
  }

  // Mermaid decision nodes have specific classes
  if (classList.contains('decision') || classList.contains('question')) {
    return 'diamond';
  }

  // Check for circles/ellipses
  if (classList.contains('circle') ||
      node.querySelector('circle') ||
      node.querySelector('ellipse')) {
    return 'circle';
  }

  return 'rectangle';
};

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
  const shape = getNodeShape(node);

  return {
    x,
    y,
    width: bbox.width,
    height: bbox.height,
    cx: x + bbox.width / 2,
    cy: y + bbox.height / 2,
    shape
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

// Calculate intersection for a diamond shape
const getDiamondIntersection = (rect: any, targetCenter: {cx: number, cy: number}) => {
    const dx = targetCenter.cx - rect.cx;
    const dy = targetCenter.cy - rect.cy;

    // If centers are the same, return center
    if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return { x: rect.cx, y: rect.cy };

    const w = rect.width / 2;
    const h = rect.height / 2;

    // For a diamond, the edges are at 45-degree angles from the corners
    // The diamond has vertices at: top (cx, cy-h), right (cx+w, cy), bottom (cx, cy+h), left (cx-w, cy)
    // We need to find where the line from center to target intersects the diamond edge

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // The diamond edge equation: |x - cx|/w + |y - cy|/h = 1
    // Parametric line: x = cx + t*dx, y = cy + t*dy
    // Substituting: t * (|dx|/w + |dy|/h) = 1
    // So: t = 1 / (|dx|/w + |dy|/h)

    const t = 1 / (absDx / w + absDy / h);

    return {
        x: rect.cx + t * dx,
        y: rect.cy + t * dy
    };
};

// Calculate intersection for a circle shape
const getCircleIntersection = (rect: any, targetCenter: {cx: number, cy: number}) => {
    const dx = targetCenter.cx - rect.cx;
    const dy = targetCenter.cy - rect.cy;

    // If centers are the same, return center
    if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return { x: rect.cx, y: rect.cy };

    const r = Math.min(rect.width, rect.height) / 2;
    const dist = Math.hypot(dx, dy);

    return {
        x: rect.cx + (dx / dist) * r,
        y: rect.cy + (dy / dist) * r
    };
};

// Calculate the intersection point between a line (from center to targetCenter) and the node's shape
const getIntersection = (rect: any, targetCenter: {cx: number, cy: number}) => {
    // Use shape-specific intersection if available
    if (rect.shape === 'diamond') {
        return getDiamondIntersection(rect, targetCenter);
    }
    if (rect.shape === 'circle') {
        return getCircleIntersection(rect, targetCenter);
    }

    // Default: rectangle intersection
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
  onSvgUpdate,
  onDragStart,
  applyTransformsRef,
  restoreSvgSnapshotRef
}) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [d3RefreshKey, setD3RefreshKey] = useState(0); // Force D3 re-init
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditingRef = useRef<boolean>(false);

  // Function to restore SVG from snapshot
  const restoreSvgSnapshot = useCallback((svgHTML: string) => {
    console.log('[DEBUG] restoreSvgSnapshot called, length:', svgHTML.length);
    if (!containerRef.current) {
      console.log('[DEBUG] containerRef.current is null');
      return;
    }
    // Replace the SVG content directly in DOM
    containerRef.current.innerHTML = svgHTML;
    // Extract just the SVG part
    const svgMatch = svgHTML.match(/<svg[\s\S]*<\/svg>/i);
    if (svgMatch) {
      // Update svgContent AND increment refresh key to force D3 re-init
      // This ensures drag handlers are re-attached even if svgContent value is same
      setSvgContent(svgMatch[0]);
      setD3RefreshKey(k => k + 1);
    }
    console.log('[DEBUG] SVG snapshot restored, triggering D3 refresh');
  }, []);

  // Register restoreSvgSnapshot with parent
  useEffect(() => {
    if (restoreSvgSnapshotRef) {
      restoreSvgSnapshotRef.current = restoreSvgSnapshot;
    }
    return () => {
      if (restoreSvgSnapshotRef) {
        restoreSvgSnapshotRef.current = null;
      }
    };
  }, [restoreSvgSnapshotRef, restoreSvgSnapshot]);

  // Collect all current node transforms
  const collectNodeTransforms = useCallback((): NodeTransform[] => {
    console.log('[DEBUG] collectNodeTransforms called');
    if (!containerRef.current) {
      console.log('[DEBUG] containerRef.current is null');
      return [];
    }

    const transforms: NodeTransform[] = [];
    const svg = d3.select(containerRef.current).select("svg");
    if (svg.empty()) {
      console.log('[DEBUG] SVG is empty');
      return [];
    }

    // Collect Mermaid nodes
    const mermaidNodes = svg.selectAll(".node");
    console.log('[DEBUG] Found', mermaidNodes.size(), 'Mermaid nodes');
    mermaidNodes.each(function() {
      const node = d3.select(this);
      const nodeId = node.attr("id") || node.attr("data-id") || '';
      const transform = node.attr("transform");
      let x = 0, y = 0;

      if (transform) {
        const match = /translate\(\s*([-\d.]+)[,\s]*([-\d.]*)\s*\)/.exec(transform);
        if (match) {
          x = parseFloat(match[1]) || 0;
          y = parseFloat(match[2]) || 0;
        }
      }

      console.log('[DEBUG] Mermaid node:', nodeId, 'transform:', transform);
      if (nodeId) {
        transforms.push({ nodeId, x, y });
      }
    });

    // Collect PlantUML entities
    const plantUMLNodes = svg.selectAll("g.entity");
    console.log('[DEBUG] Found', plantUMLNodes.size(), 'PlantUML entities');
    plantUMLNodes.each(function() {
      const node = d3.select(this);
      const nodeId = node.attr("id") || node.attr("data-entity") || '';
      const transform = node.attr("transform");
      let x = 0, y = 0;

      if (transform) {
        const match = /translate\(\s*([-\d.]+)[,\s]*([-\d.]*)\s*\)/.exec(transform);
        if (match) {
          x = parseFloat(match[1]) || 0;
          y = parseFloat(match[2]) || 0;
        }
      }

      console.log('[DEBUG] PlantUML node:', nodeId, 'transform:', transform);
      if (nodeId) {
        transforms.push({ nodeId, x, y });
      }
    });

    return transforms;
  }, []);

  // Apply transforms to nodes (for undo/redo)
  const applyNodeTransforms = useCallback((transforms: NodeTransform[]) => {
    console.log('[DEBUG] applyNodeTransforms called with', transforms.length, 'transforms');
    if (!containerRef.current) {
      console.log('[DEBUG] applyNodeTransforms: containerRef.current is null');
      return;
    }

    const svg = d3.select(containerRef.current).select("svg");
    if (svg.empty()) {
      console.log('[DEBUG] applyNodeTransforms: SVG is empty');
      return;
    }

    // Apply transforms to nodes
    let applied = 0;
    transforms.forEach(({ nodeId, x, y }) => {
      let node = svg.select(`#${CSS.escape(nodeId)}`);
      if (node.empty()) {
        node = svg.select(`[data-entity="${nodeId}"]`);
      }
      if (!node.empty()) {
        node.attr("transform", `translate(${x}, ${y})`);
        applied++;
      }
    });
    console.log('[DEBUG] Applied', applied, 'node transforms');

    // Update all edges after applying node transforms
    const nodes = svg.selectAll(".node");
    const edges = svg.selectAll(".edgePaths path");
    const labels = svg.selectAll(".edgeLabels .edgeLabel");

    // Build node data for edge calculations
    const nodeData = nodes.nodes().map((n: any) => ({
      element: n,
      bbox: getNodeBBox(n)
    }));

    // Build edge metadata
    interface EdgeMeta {
      edgeEl: any;
      labelEl: any;
      sourceNode: any;
      targetNode: any;
    }
    const edgeMeta: EdgeMeta[] = [];

    edges.each(function() {
      const el = d3.select(this);
      const dAttr = el.attr("d");
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

      nodeData.forEach((nd: any) => {
        const distStart = Math.hypot(nd.bbox.cx - startX, nd.bbox.cy - startY);
        const inStart = isPointInBBox({x: startX, y: startY}, nd.bbox);
        if (inStart || distStart < minStartDist) {
          if (inStart) { bestStartNode = nd.element; minStartDist = -1; }
          else if (minStartDist !== -1) { minStartDist = distStart; bestStartNode = nd.element; }
        }

        const distEnd = Math.hypot(nd.bbox.cx - endX, nd.bbox.cy - endY);
        const inEnd = isPointInBBox({x: endX, y: endY}, nd.bbox);
        if (inEnd || distEnd < minEndDist) {
          if (inEnd) { bestEndNode = nd.element; minEndDist = -1; }
          else if (minEndDist !== -1) { minEndDist = distEnd; bestEndNode = nd.element; }
        }
      });

      if (minStartDist > 200 && minStartDist !== -1) bestStartNode = null;
      if (minEndDist > 200 && minEndDist !== -1) bestEndNode = null;

      if (bestStartNode && bestEndNode) {
        const edgeMidX = (startX + endX) / 2;
        const edgeMidY = (startY + endY) / 2;

        let closestLabel: any = null;
        let minLabelDist = Infinity;

        labels.each(function() {
          const labelNode = this as SVGGElement;
          const labelTransform = d3.select(labelNode).attr("transform");
          let labelX = 0, labelY = 0;
          if (labelTransform) {
            const match = /translate\(\s*([-\d.]+)[,\s]*([-\d.]*)\s*\)/.exec(labelTransform);
            if (match) { labelX = parseFloat(match[1]) || 0; labelY = parseFloat(match[2]) || 0; }
          }
          const dist = Math.hypot(labelX - edgeMidX, labelY - edgeMidY);
          if (dist < minLabelDist) { minLabelDist = dist; closestLabel = labelNode; }
        });

        edgeMeta.push({
          edgeEl: el,
          labelEl: minLabelDist < 150 ? closestLabel : null,
          sourceNode: bestStartNode,
          targetNode: bestEndNode
        });
      }
    });

    // Update all edges
    edgeMeta.forEach(item => {
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
        const labelBBox = (item.labelEl as SVGGElement).getBBox();
        const centeredX = midX - labelBBox.width / 2;
        const centeredY = midY - labelBBox.height / 2;
        d3.select(item.labelEl).attr("transform", `translate(${centeredX}, ${centeredY})`);
      }
    });

    console.log('[DEBUG] Updated', edgeMeta.length, 'edges');
  }, []);

  // Register applyNodeTransforms with parent
  useEffect(() => {
    if (applyTransformsRef) {
      applyTransformsRef.current = applyNodeTransforms;
    }
    return () => {
      if (applyTransformsRef) {
        applyTransformsRef.current = null;
      }
    };
  }, [applyTransformsRef, applyNodeTransforms]);

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

      // Check if code is PlantUML - render via external server
      if (isPlantUML(code)) {
        try {
          const svg = await renderPlantUML(code);
          if (cancelled) return;

          // Add overflow visible to SVG
          const adjustedSvg = svg.replace(
            /<svg([^>]*)>/i,
            (match, attrs) => {
              if (attrs.includes('style="')) {
                return match.replace(/style="([^"]*)"/i, 'style="$1; overflow: visible;"');
              } else {
                return `<svg${attrs} style="overflow: visible;">`;
              }
            }
          );

          setSvgContent(adjustedSvg);
          onSuccess();
          return;
        } catch (e: any) {
          if (cancelled) return;
          onError(e.message || 'Erro ao renderizar PlantUML');
          return;
        }
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

        // Strip markdown code fences if present (e.g., ```mermaid ... ```)
        let codeToRender = code.trim();
        const codeFenceMatch = codeToRender.match(/^```(?:mermaid)?\s*\n([\s\S]*?)\n```$/);
        if (codeFenceMatch) {
          codeToRender = codeFenceMatch[1].trim();
        }

        // Para classDiagram, usa init directive para forçar re-render completo
        if (codeToRender.toLowerCase().startsWith('classdiagram')) {
          const hasLR = /direction\s+LR/i.test(codeToRender);
          const direction = hasLR ? 'LR' : 'TB';
          // Usa timestamp + counter para garantir que cada render seja único
          const cacheBuster = `${globalRenderCounter}_${Date.now()}`;
          const initDirective = `%%{init: {'flowchart': {'diagramPadding': ${cacheBuster.length}}, 'themeVariables': {'cacheBust': '${cacheBuster}'}}}%%\n`;
          codeToRender = initDirective + codeToRender.replace(/direction\s+(TD|TB|LR|RL)/gi, `direction ${direction}`);
        }

        const { svg } = await mermaidInstance.render(id, codeToRender);

        if (cancelled) return;

        // Add overflow visible to SVG to prevent clipping when panning
        const adjustedSvg = svg.replace(
          /<svg([^>]*)>/i,
          (match, attrs) => {
            // Add or update style attribute
            if (attrs.includes('style="')) {
              return match.replace(/style="([^"]*)"/i, 'style="$1; overflow: visible;"');
            } else {
              return `<svg${attrs} style="overflow: visible;">`;
            }
          }
        );

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

    // Check if this is PlantUML or Mermaid SVG
    // PlantUML uses class="entity" for nodes, Mermaid uses class="node"
    const isPlantUMLSvg = svg.select(".entity").node() !== null;

    // ========== PlantUML: Drag with edge reconnection ==========
    if (isPlantUMLSvg) {
      const plantUMLNodes = svg.selectAll("g.entity");
      const plantUMLLinks = svg.selectAll("g.link");

      // Build edge metadata: map entity names to their elements and links
      interface PlantUMLEdge {
        linkGroup: any;
        pathEl: any;
        polygonEl: any;
        sourceEntity: string;
        targetEntity: string;
      }

      const plantUMLEdges: PlantUMLEdge[] = [];

      plantUMLLinks.each(function() {
        const linkGroup = d3.select(this);
        const pathEl = linkGroup.select("path");
        const polygonEl = linkGroup.select("polygon");
        const pathId = pathEl.attr("id") || "";

        // Parse ID like "Car-to-Engine"
        const match = pathId.match(/^(.+)-to-(.+)$/);
        if (match) {
          plantUMLEdges.push({
            linkGroup,
            pathEl,
            polygonEl,
            sourceEntity: match[1],
            targetEntity: match[2]
          });
        }
      });

      // Helper to get entity bbox with transform
      const getEntityBBox = (entityName: string): { x: number; y: number; width: number; height: number; cx: number; cy: number } | null => {
        const entity = svg.select(`#entity_${entityName}`);
        if (entity.empty()) return null;

        const el = entity.node() as SVGGElement;
        const bbox = el.getBBox();

        // Get transform offset
        const transform = entity.attr("transform");
        let tx = 0, ty = 0;
        if (transform) {
          const match = /translate\(\s*([-\d.]+)[,\s]*([-\d.]*)\s*\)/.exec(transform);
          if (match) {
            tx = parseFloat(match[1]) || 0;
            ty = parseFloat(match[2]) || 0;
          }
        }

        return {
          x: bbox.x + tx,
          y: bbox.y + ty,
          width: bbox.width,
          height: bbox.height,
          cx: bbox.x + tx + bbox.width / 2,
          cy: bbox.y + ty + bbox.height / 2
        };
      };

      // Update connected edges when a node is dragged
      const updatePlantUMLEdges = (entityName: string) => {
        plantUMLEdges.forEach(edge => {
          if (edge.sourceEntity !== entityName && edge.targetEntity !== entityName) return;

          const sourceBBox = getEntityBBox(edge.sourceEntity);
          const targetBBox = getEntityBBox(edge.targetEntity);

          if (!sourceBBox || !targetBBox) return;

          // Calculate connection points based on relative positions
          let startX: number, startY: number, endX: number, endY: number;
          let isVertical: boolean;

          const dx = targetBBox.cx - sourceBBox.cx;
          const dy = targetBBox.cy - sourceBBox.cy;

          if (Math.abs(dy) > Math.abs(dx)) {
            // Vertical connection
            isVertical = true;
            if (dy > 0) {
              // Target is below source
              startX = sourceBBox.cx;
              startY = sourceBBox.y + sourceBBox.height;
              endX = targetBBox.cx;
              endY = targetBBox.y;
            } else {
              // Target is above source
              startX = sourceBBox.cx;
              startY = sourceBBox.y;
              endX = targetBBox.cx;
              endY = targetBBox.y + targetBBox.height;
            }
          } else {
            // Horizontal connection
            isVertical = false;
            if (dx > 0) {
              // Target is to the right
              startX = sourceBBox.x + sourceBBox.width;
              startY = sourceBBox.cy;
              endX = targetBBox.x;
              endY = targetBBox.cy;
            } else {
              // Target is to the left
              startX = sourceBBox.x;
              startY = sourceBBox.cy;
              endX = targetBBox.x + targetBBox.width;
              endY = targetBBox.cy;
            }
          }

          // Update path with appropriate curve
          let newD: string;
          const arrowOffset = 6; // Space for arrowhead

          if (isVertical) {
            // Vertical: use vertical bezier curve
            const adjustedEndY = dy > 0 ? endY - arrowOffset : endY + arrowOffset;
            newD = `M${startX},${startY} C${startX},${(startY + adjustedEndY) / 2} ${endX},${(startY + adjustedEndY) / 2} ${endX},${adjustedEndY}`;
          } else {
            // Horizontal: use horizontal bezier curve
            const adjustedEndX = dx > 0 ? endX - arrowOffset : endX + arrowOffset;
            newD = `M${startX},${startY} C${(startX + adjustedEndX) / 2},${startY} ${(startX + adjustedEndX) / 2},${endY} ${adjustedEndX},${endY}`;
          }
          edge.pathEl.attr("d", newD);

          // Update arrowhead polygon position
          const arrowSize = 4;
          let arrowPoints: string;

          if (isVertical) {
            if (dy > 0) {
              // Arrow pointing down
              arrowPoints = `${endX},${endY},${endX - arrowSize},${endY - arrowSize * 2.25},${endX},${endY - arrowSize},${endX + arrowSize},${endY - arrowSize * 2.25},${endX},${endY}`;
            } else {
              // Arrow pointing up
              arrowPoints = `${endX},${endY},${endX - arrowSize},${endY + arrowSize * 2.25},${endX},${endY + arrowSize},${endX + arrowSize},${endY + arrowSize * 2.25},${endX},${endY}`;
            }
          } else {
            if (dx > 0) {
              // Arrow pointing right
              arrowPoints = `${endX},${endY},${endX - arrowSize * 2.25},${endY - arrowSize},${endX - arrowSize},${endY},${endX - arrowSize * 2.25},${endY + arrowSize},${endX},${endY}`;
            } else {
              // Arrow pointing left
              arrowPoints = `${endX},${endY},${endX + arrowSize * 2.25},${endY - arrowSize},${endX + arrowSize},${endY},${endX + arrowSize * 2.25},${endY + arrowSize},${endX},${endY}`;
            }
          }

          edge.polygonEl.attr("points", arrowPoints);
        });
      };

      // Drag behavior
      const plantUMLDrag = d3.drag()
        .on("start", function() {
          // Save SVG snapshot BEFORE dragging for undo
          if (onDragStart) {
            const svgEl = svg.node() as SVGSVGElement | null;
            onDragStart(svgEl);
          }
          d3.select(this).raise().classed("active", true).style("cursor", "grabbing");
          setIsDraggingNode(true);
        })
        .on("drag", function(event: any) {
          const node = d3.select(this);
          const entityName = node.attr("data-entity");
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

          // Update connected edges
          if (entityName) {
            updatePlantUMLEdges(entityName);
          }
        })
        .on("end", function() {
          d3.select(this).classed("active", false).style("cursor", "grab");
          setIsDraggingNode(false);
        });

      plantUMLNodes.style("cursor", "grab").call(plantUMLDrag as any);
      return;
    }

    // ========== Mermaid: Full drag with edge reconnection ==========
    const nodes = svg.selectAll(".node");
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
        const el = d3.select(this);
        const dAttr = el.attr("d");
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

        nodeData.forEach((nd: any) => {
            // Check Start
            const distStart = Math.hypot(nd.bbox.cx - startX, nd.bbox.cy - startY);
            const inStart = isPointInBBox({x: startX, y: startY}, nd.bbox);

            if (inStart || distStart < minStartDist) {
                if (inStart) {
                     bestStartNode = nd.element;
                     minStartDist = -1;
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

        // Filter out bad matches
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
                edgeEl: el,
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
        // Save SVG snapshot BEFORE dragging for undo
        if (onDragStart) {
          const svgEl = svg.node() as SVGSVGElement | null;
          onDragStart(svgEl);
        }
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

  }, [svgContent, d3RefreshKey, setIsDraggingNode, onDragStart, collectNodeTransforms]);

  if (!svgContent) {
    return <div className="text-gray-400">Gerando visualização...</div>;
  }

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center [&>svg]:overflow-visible"
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

