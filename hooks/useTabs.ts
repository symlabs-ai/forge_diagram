import { useState, useCallback, useEffect } from 'react';
import { DiagramTab, TabsState, MAX_TABS, TabType, LinkedDiagramSource } from '../types';
import { INITIAL_CODE } from '../utils/mermaidUtils';

const TABS_STORAGE_KEY = 'forge-draw-tabs';

// Default markdown content for new markdown tabs
const INITIAL_MARKDOWN = `# Hello World

This is a **markdown** file.

## Features

- Lists
- **Bold** and *italic*
- [Links](https://example.com)

\`\`\`javascript
console.log('Code blocks');
\`\`\`
`;

function generateId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface CreateTabOptions {
  name?: string;
  code?: string;
  type?: TabType;
  filePath?: string;
  linkedSource?: LinkedDiagramSource;
}

function createNewTab(options: CreateTabOptions = {}): DiagramTab {
  const { name, code, type = 'diagram', filePath, linkedSource } = options;
  const defaultCode = type === 'markdown' ? INITIAL_MARKDOWN : INITIAL_CODE;

  return {
    id: generateId(),
    name: name || (type === 'markdown' ? 'Untitled.md' : `Diagram ${new Date().toLocaleTimeString()}`),
    code: code || defaultCode,
    isDirty: false,
    createdAt: Date.now(),
    type,
    filePath,
    linkedSource,
  };
}

// Migrate old tabs without type field and ensure code is valid
function migrateTab(tab: DiagramTab): DiagramTab {
  const migratedTab = { ...tab };
  if (!migratedTab.type) {
    migratedTab.type = 'diagram';
  }
  // Ensure code is always a string
  if (typeof migratedTab.code !== 'string') {
    migratedTab.code = migratedTab.type === 'markdown' ? INITIAL_MARKDOWN : INITIAL_CODE;
  }
  return migratedTab;
}

function loadTabsFromStorage(): TabsState | null {
  try {
    const stored = localStorage.getItem(TABS_STORAGE_KEY);
    if (stored) {
      const state = JSON.parse(stored) as TabsState;
      // Migrate old tabs without type field
      return {
        ...state,
        tabs: state.tabs.map(migrateTab),
      };
    }
  } catch (e) {
    console.error('Failed to load tabs from storage:', e);
  }
  return null;
}

function saveTabsToStorage(state: TabsState): void {
  try {
    localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save tabs to storage:', e);
  }
}

export interface AddTabOptions {
  code?: string;
  type?: TabType;
  name?: string;
  filePath?: string;
  linkedSource?: LinkedDiagramSource;
}

export interface UseTabsReturn {
  tabs: DiagramTab[];
  activeTab: DiagramTab | null;
  activeTabId: string;
  addTab: (options?: AddTabOptions | string) => void; // string for backwards compatibility
  addLinkedTab: (code: string, linkedSource: LinkedDiagramSource) => void; // For diagrams from markdown
  closeTab: (id: string) => void;
  selectTab: (id: string) => void;
  renameTab: (id: string, name: string) => void;
  updateTabCode: (id: string, code: string, markDirty?: boolean) => void;
  markTabClean: (id: string) => void;
  updateTabType: (id: string, type: TabType) => void;
  canAddTab: boolean;
  findLinkedTab: (filePath: string, diagramIndex: number) => DiagramTab | undefined;
}

export function useTabs(initialCode?: string): UseTabsReturn {
  const [state, setState] = useState<TabsState>(() => {
    const stored = loadTabsFromStorage();
    if (stored && stored.tabs.length > 0) {
      return stored;
    }
    // Create initial tab
    const initialTab = createNewTab({ name: 'Diagram 1', code: initialCode || INITIAL_CODE, type: 'diagram' });
    return {
      tabs: [initialTab],
      activeTabId: initialTab.id,
    };
  });

  // Save to storage whenever state changes
  useEffect(() => {
    saveTabsToStorage(state);
  }, [state]);

  const activeTab = state.tabs.find(t => t.id === state.activeTabId) || state.tabs[0] || null;
  const canAddTab = state.tabs.length < MAX_TABS;

  const addTab = useCallback((options?: AddTabOptions | string) => {
    if (!canAddTab) return;

    setState(prev => {
      // Handle backwards compatibility - if string is passed, treat as code
      const opts: CreateTabOptions = typeof options === 'string'
        ? { code: options, type: 'diagram' }
        : {
            code: options?.code,
            type: options?.type || 'diagram',
            name: options?.name || (options?.type === 'markdown'
              ? `Markdown ${prev.tabs.filter(t => t.type === 'markdown').length + 1}.md`
              : `Diagram ${prev.tabs.filter(t => t.type === 'diagram').length + 1}`),
            filePath: options?.filePath,
            linkedSource: options?.linkedSource,
          };

      const newTab = createNewTab(opts);
      return {
        tabs: [...prev.tabs, newTab],
        activeTabId: newTab.id,
      };
    });
  }, [canAddTab]);

  // Add a tab linked to a diagram in a markdown file
  const addLinkedTab = useCallback((code: string, linkedSource: LinkedDiagramSource) => {
    if (!canAddTab) return;

    // Check if a tab for this linked diagram already exists
    const existingTab = state.tabs.find(t =>
      t.linkedSource?.filePath === linkedSource.filePath &&
      t.linkedSource?.diagramIndex === linkedSource.diagramIndex
    );

    if (existingTab) {
      // Tab already exists, just select it
      setState(prev => ({
        ...prev,
        activeTabId: existingTab.id,
      }));
      return;
    }

    // Create a name based on file name and diagram index
    const fileName = linkedSource.filePath.split('/').pop() || 'Unknown';
    const diagramNum = linkedSource.diagramIndex + 1;
    const diagramType = linkedSource.diagramType === 'mermaid' ? 'Mermaid' : 'PlantUML';
    const name = `${fileName} - ${diagramType} #${diagramNum}`;

    setState(prev => {
      const newTab = createNewTab({
        name,
        code,
        type: 'diagram',
        linkedSource,
      });
      return {
        tabs: [...prev.tabs, newTab],
        activeTabId: newTab.id,
      };
    });
  }, [canAddTab, state.tabs]);

  // Find a tab linked to a specific diagram
  const findLinkedTab = useCallback((filePath: string, diagramIndex: number): DiagramTab | undefined => {
    return state.tabs.find(t =>
      t.linkedSource?.filePath === filePath &&
      t.linkedSource?.diagramIndex === diagramIndex
    );
  }, [state.tabs]);

  const closeTab = useCallback((id: string) => {
    setState(prev => {
      const tabIndex = prev.tabs.findIndex(t => t.id === id);
      const newTabs = prev.tabs.filter(t => t.id !== id);

      // If no tabs left, return empty state
      if (newTabs.length === 0) {
        return {
          tabs: [],
          activeTabId: '',
        };
      }

      // If closing active tab, select adjacent tab
      let newActiveId = prev.activeTabId;
      if (id === prev.activeTabId) {
        const newIndex = Math.min(tabIndex, newTabs.length - 1);
        newActiveId = newTabs[newIndex].id;
      }

      return {
        tabs: newTabs,
        activeTabId: newActiveId,
      };
    });
  }, []);

  const selectTab = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      activeTabId: id,
    }));
  }, []);

  const renameTab = useCallback((id: string, name: string) => {
    setState(prev => ({
      ...prev,
      tabs: prev.tabs.map(t =>
        t.id === id ? { ...t, name: name.trim() || t.name } : t
      ),
    }));
  }, []);

  const updateTabCode = useCallback((id: string, code: string, markDirty: boolean = true) => {
    setState(prev => ({
      ...prev,
      tabs: prev.tabs.map(t =>
        t.id === id ? { ...t, code, isDirty: markDirty } : t
      ),
    }));
  }, []);

  const markTabClean = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      tabs: prev.tabs.map(t =>
        t.id === id ? { ...t, isDirty: false } : t
      ),
    }));
  }, []);

  const updateTabType = useCallback((id: string, type: TabType) => {
    setState(prev => ({
      ...prev,
      tabs: prev.tabs.map(t =>
        t.id === id ? { ...t, type } : t
      ),
    }));
  }, []);

  return {
    tabs: state.tabs,
    activeTab,
    activeTabId: state.activeTabId,
    addTab,
    addLinkedTab,
    closeTab,
    selectTab,
    renameTab,
    updateTabCode,
    markTabClean,
    updateTabType,
    canAddTab,
    findLinkedTab,
  };
}
