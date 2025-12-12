import { useCallback, useEffect, useState, useRef } from 'react';
import type { SavedDiagram, AppSettings } from '../types';
import {
  getDiagrams,
  saveDiagram,
  deleteDiagram,
  getSettings,
  saveSettings,
  saveAutoSaveContent,
  getAutoSaveContent,
} from '../utils/storageUtils';

interface UseDiagramStorageOptions {
  code: string;
  onLoadDiagram: (code: string) => void;
}

interface UseDiagramStorageReturn {
  diagrams: SavedDiagram[];
  save: (name: string) => SavedDiagram;
  load: (id: string) => void;
  remove: (id: string) => void;
  refresh: () => void;
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  autoSaveEnabled: boolean;
  toggleAutoSave: () => void;
  recoveredCode: string | null;
  clearRecoveredCode: () => void;
}

export function useDiagramStorage({ code, onLoadDiagram }: UseDiagramStorageOptions): UseDiagramStorageReturn {
  const [diagrams, setDiagrams] = useState<SavedDiagram[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getSettings);
  const [recoveredCode, setRecoveredCode] = useState<string | null>(null);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load diagrams on mount
  useEffect(() => {
    setDiagrams(getDiagrams());

    // Check for auto-saved content
    const savedCode = getAutoSaveContent();
    if (savedCode && savedCode !== code) {
      setRecoveredCode(savedCode);
    }
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (!settings.autoSave) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      saveAutoSaveContent(code);
    }, settings.autoSaveInterval);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [code, settings.autoSave, settings.autoSaveInterval]);

  const save = useCallback((name: string): SavedDiagram => {
    const saved = saveDiagram({ name, code });
    setDiagrams(getDiagrams());
    return saved;
  }, [code]);

  const load = useCallback((id: string) => {
    const diagram = diagrams.find(d => d.id === id);
    if (diagram) {
      onLoadDiagram(diagram.code);
    }
  }, [diagrams, onLoadDiagram]);

  const remove = useCallback((id: string) => {
    deleteDiagram(id);
    setDiagrams(getDiagrams());
  }, []);

  const refresh = useCallback(() => {
    setDiagrams(getDiagrams());
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    const updated = saveSettings(newSettings);
    setSettings(updated);
  }, []);

  const toggleAutoSave = useCallback(() => {
    const updated = saveSettings({ autoSave: !settings.autoSave });
    setSettings(updated);
  }, [settings.autoSave]);

  const clearRecoveredCode = useCallback(() => {
    setRecoveredCode(null);
  }, []);

  return {
    diagrams,
    save,
    load,
    remove,
    refresh,
    settings,
    updateSettings,
    autoSaveEnabled: settings.autoSave,
    toggleAutoSave,
    recoveredCode,
    clearRecoveredCode,
  };
}
