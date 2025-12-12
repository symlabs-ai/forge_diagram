import { useState, useCallback, useEffect } from 'react';
import { DiagramTab, TabsState, MAX_TABS } from '../types';
import { INITIAL_CODE } from '../utils/mermaidUtils';

const TABS_STORAGE_KEY = 'forge-draw-tabs';

function generateId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createNewTab(name?: string, code?: string): DiagramTab {
  return {
    id: generateId(),
    name: name || `Diagram ${new Date().toLocaleTimeString()}`,
    code: code || INITIAL_CODE,
    isDirty: false,
    createdAt: Date.now(),
  };
}

function loadTabsFromStorage(): TabsState | null {
  try {
    const stored = localStorage.getItem(TABS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
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

export interface UseTabsReturn {
  tabs: DiagramTab[];
  activeTab: DiagramTab;
  activeTabId: string;
  addTab: (code?: string) => void;
  closeTab: (id: string) => void;
  selectTab: (id: string) => void;
  renameTab: (id: string, name: string) => void;
  updateTabCode: (id: string, code: string) => void;
  canAddTab: boolean;
}

export function useTabs(initialCode?: string): UseTabsReturn {
  const [state, setState] = useState<TabsState>(() => {
    const stored = loadTabsFromStorage();
    if (stored && stored.tabs.length > 0) {
      return stored;
    }
    // Create initial tab
    const initialTab = createNewTab('Diagram 1', initialCode || INITIAL_CODE);
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

  const addTab = useCallback((code?: string) => {
    if (!canAddTab) return;

    setState(prev => {
      const newTab = createNewTab(`Diagram ${prev.tabs.length + 1}`, code);
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

  return {
    tabs: state.tabs,
    activeTab,
    activeTabId: state.activeTabId,
    addTab,
    closeTab,
    selectTab,
    renameTab,
    updateTabCode,
    canAddTab,
  };
}
