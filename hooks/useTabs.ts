import { useState, useCallback, useEffect } from 'react';
import { DiagramTab, TabsState, MAX_TABS, TabType } from '../types';
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
}

function createNewTab(options: CreateTabOptions = {}): DiagramTab {
  const { name, code, type = 'diagram', filePath } = options;
  const defaultCode = type === 'markdown' ? INITIAL_MARKDOWN : INITIAL_CODE;

  return {
    id: generateId(),
    name: name || (type === 'markdown' ? 'Untitled.md' : `Diagram ${new Date().toLocaleTimeString()}`),
    code: code || defaultCode,
    isDirty: false,
    createdAt: Date.now(),
    type,
    filePath,
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
}

export interface UseTabsReturn {
  tabs: DiagramTab[];
  activeTab: DiagramTab;
  activeTabId: string;
  addTab: (options?: AddTabOptions | string) => void; // string for backwards compatibility
  closeTab: (id: string) => void;
  selectTab: (id: string) => void;
  renameTab: (id: string, name: string) => void;
  updateTabCode: (id: string, code: string) => void;
  updateTabType: (id: string, type: TabType) => void;
  canAddTab: boolean;
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

  const activeTab = state.tabs.find(t => t.id === state.activeTabId) || state.tabs[0];
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
          };

      const newTab = createNewTab(opts);
      return {
        tabs: [...prev.tabs, newTab],
        activeTabId: newTab.id,
      };
    });
  }, [canAddTab]);

  const closeTab = useCallback((id: string) => {
    setState(prev => {
      // Don't close the last tab
      if (prev.tabs.length <= 1) return prev;

      const tabIndex = prev.tabs.findIndex(t => t.id === id);
      const newTabs = prev.tabs.filter(t => t.id !== id);

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

  const updateTabCode = useCallback((id: string, code: string) => {
    setState(prev => ({
      ...prev,
      tabs: prev.tabs.map(t =>
        t.id === id ? { ...t, code, isDirty: true } : t
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
    closeTab,
    selectTab,
    renameTab,
    updateTabCode,
    updateTabType,
    canAddTab,
  };
}
