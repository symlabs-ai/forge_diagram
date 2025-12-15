import { useState, useCallback, useEffect } from 'react';
import { ActivityView } from '../types';

const STORAGE_KEY = 'forge-diagram-activitybar';

interface ActivityBarState {
  activeView: ActivityView;
  isSidebarOpen: boolean;
  sidebarWidth: number;
}

interface UseActivityBarReturn {
  activeView: ActivityView;
  setActiveView: (view: ActivityView) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
}

const DEFAULT_STATE: ActivityBarState = {
  activeView: 'explorer',
  isSidebarOpen: true,
  sidebarWidth: 250
};

export function useActivityBar(): UseActivityBarReturn {
  const [state, setState] = useState<ActivityBarState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_STATE, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error loading activity bar state:', e);
    }
    return DEFAULT_STATE;
  });

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving activity bar state:', e);
    }
  }, [state]);

  const setActiveView = useCallback((view: ActivityView) => {
    setState(prev => {
      // If clicking the same view, toggle sidebar
      if (prev.activeView === view && prev.isSidebarOpen) {
        return { ...prev, isSidebarOpen: false };
      }
      // Otherwise, open sidebar with new view
      return { ...prev, activeView: view, isSidebarOpen: true };
    });
  }, []);

  const toggleSidebar = useCallback(() => {
    setState(prev => ({ ...prev, isSidebarOpen: !prev.isSidebarOpen }));
  }, []);

  const openSidebar = useCallback(() => {
    setState(prev => ({ ...prev, isSidebarOpen: true }));
  }, []);

  const closeSidebar = useCallback(() => {
    setState(prev => ({ ...prev, isSidebarOpen: false }));
  }, []);

  const setSidebarWidth = useCallback((width: number) => {
    // Clamp width between 150 and 500
    const clampedWidth = Math.max(150, Math.min(500, width));
    setState(prev => ({ ...prev, sidebarWidth: clampedWidth }));
  }, []);

  return {
    activeView: state.activeView,
    setActiveView,
    isSidebarOpen: state.isSidebarOpen,
    toggleSidebar,
    openSidebar,
    closeSidebar,
    sidebarWidth: state.sidebarWidth,
    setSidebarWidth
  };
}
