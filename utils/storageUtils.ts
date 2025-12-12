import type { SavedDiagram, DiagramStorage, AppSettings } from '../types';

const DIAGRAMS_KEY = 'mermaid-pro-viz-diagrams';
const SETTINGS_KEY = 'mermaid-pro-viz-settings';
const AUTOSAVE_KEY = 'mermaid-pro-viz-autosave';
const STORAGE_VERSION = 1;

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Get all saved diagrams from localStorage
 */
export function getDiagrams(): SavedDiagram[] {
  try {
    const data = localStorage.getItem(DIAGRAMS_KEY);
    if (!data) return [];

    const storage: DiagramStorage = JSON.parse(data);
    return storage.diagrams || [];
  } catch (err) {
    console.error('Error reading diagrams from localStorage:', err);
    return [];
  }
}

/**
 * Save diagrams to localStorage
 */
function saveDiagrams(diagrams: SavedDiagram[]): void {
  const storage: DiagramStorage = {
    version: STORAGE_VERSION,
    diagrams,
  };
  localStorage.setItem(DIAGRAMS_KEY, JSON.stringify(storage));
}

/**
 * Save a new diagram or update existing
 */
export function saveDiagram(diagram: Omit<SavedDiagram, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): SavedDiagram {
  const diagrams = getDiagrams();
  const now = Date.now();

  if (diagram.id) {
    // Update existing
    const index = diagrams.findIndex(d => d.id === diagram.id);
    if (index >= 0) {
      const updated: SavedDiagram = {
        ...diagrams[index],
        ...diagram,
        updatedAt: now,
      };
      diagrams[index] = updated;
      saveDiagrams(diagrams);
      return updated;
    }
  }

  // Create new
  const newDiagram: SavedDiagram = {
    id: generateId(),
    name: diagram.name,
    code: diagram.code,
    createdAt: now,
    updatedAt: now,
  };
  diagrams.unshift(newDiagram);
  saveDiagrams(diagrams);
  return newDiagram;
}

/**
 * Get a diagram by ID
 */
export function getDiagramById(id: string): SavedDiagram | null {
  const diagrams = getDiagrams();
  return diagrams.find(d => d.id === id) || null;
}

/**
 * Delete a diagram by ID
 */
export function deleteDiagram(id: string): boolean {
  const diagrams = getDiagrams();
  const filtered = diagrams.filter(d => d.id !== id);
  if (filtered.length !== diagrams.length) {
    saveDiagrams(filtered);
    return true;
  }
  return false;
}

/**
 * Get app settings
 */
export function getSettings(): AppSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) {
      return getDefaultSettings();
    }
    return { ...getDefaultSettings(), ...JSON.parse(data) };
  } catch (err) {
    console.error('Error reading settings from localStorage:', err);
    return getDefaultSettings();
  }
}

/**
 * Save app settings
 */
export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Get default settings
 */
export function getDefaultSettings(): AppSettings {
  return {
    autoSave: true,
    autoSaveInterval: 5000,
    maxHistorySize: 50,
  };
}

/**
 * Save auto-save content (current working diagram)
 */
export function saveAutoSaveContent(code: string): void {
  localStorage.setItem(AUTOSAVE_KEY, code);
}

/**
 * Get auto-save content
 */
export function getAutoSaveContent(): string | null {
  return localStorage.getItem(AUTOSAVE_KEY);
}

/**
 * Clear auto-save content
 */
export function clearAutoSaveContent(): void {
  localStorage.removeItem(AUTOSAVE_KEY);
}
