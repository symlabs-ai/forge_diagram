import { useCallback, useState, useEffect, useRef } from 'react';

export interface NodeTransform {
  nodeId: string;
  x: number;
  y: number;
}

// Store complete SVG snapshot for accurate undo/redo
export interface VisualSnapshot {
  svgInnerHTML: string;
  timestamp: number;
}

interface VisualHistoryReturn {
  // Call this BEFORE making a change (saves current state to history)
  pushState: (transforms: NodeTransform[]) => void;
  pushSnapshot: (svgInnerHTML: string) => void;
  pushSnapshotToFuture: (svgInnerHTML: string) => void; // For redo support
  pushSnapshotToPast: (svgInnerHTML: string) => void; // For redo - doesn't clear future
  undo: () => NodeTransform[] | null;
  undoSnapshot: () => VisualSnapshot | null;
  redo: () => NodeTransform[] | null;
  redoSnapshot: () => VisualSnapshot | null;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
}

export function useVisualHistory(maxSize: number = 50): VisualHistoryReturn {
  const [past, setPast] = useState<NodeTransform[][]>([]);
  const [future, setFuture] = useState<NodeTransform[][]>([]);

  // Snapshot-based history for complete SVG state
  const [snapshotPast, setSnapshotPast] = useState<VisualSnapshot[]>([]);
  const [snapshotFuture, setSnapshotFuture] = useState<VisualSnapshot[]>([]);

  const renderCount = useRef(0);
  renderCount.current++;

  // Debug: log state changes
  useEffect(() => {
    console.log('[useVisualHistory] State updated - past.length:', past.length, 'future.length:', future.length, 'render #', renderCount.current);
  }, [past, future]);

  useEffect(() => {
    console.log('[useVisualHistory] Snapshot state - snapshotPast:', snapshotPast.length, 'snapshotFuture:', snapshotFuture.length);
  }, [snapshotPast, snapshotFuture]);

  // Push current state to history (call BEFORE making changes)
  const pushState = useCallback((transforms: NodeTransform[]) => {
    console.log('[useVisualHistory] pushState called with', transforms.length, 'transforms');
    if (transforms.length === 0) {
      console.log('[useVisualHistory] Empty transforms, returning');
      return;
    }
    console.log('[useVisualHistory] Calling setPast');
    setPast(prev => {
      console.log('[useVisualHistory] setPast callback, prev.length:', prev.length);
      const newPast = [...prev, transforms].slice(-maxSize);
      console.log('[useVisualHistory] newPast.length:', newPast.length);
      return newPast;
    });
    setFuture([]); // Clear redo stack on new action
  }, [maxSize]);

  const undo = useCallback((): NodeTransform[] | null => {
    if (past.length === 0) return null;

    const previous = past[past.length - 1];
    setPast(prev => prev.slice(0, -1));

    // Note: We don't push to future here because we need the CURRENT state
    // which we don't have. The caller should handle saving current before undo.
    return previous;
  }, [past]);

  const redo = useCallback((): NodeTransform[] | null => {
    if (future.length === 0) return null;

    const next = future[0];
    setFuture(prev => prev.slice(1));
    return next;
  }, [future]);

  // Snapshot-based functions for complete SVG state
  const pushSnapshot = useCallback((svgInnerHTML: string) => {
    console.log('[useVisualHistory] pushSnapshot called, HTML length:', svgInnerHTML.length);
    if (!svgInnerHTML) return;

    const snapshot: VisualSnapshot = {
      svgInnerHTML,
      timestamp: Date.now()
    };

    setSnapshotPast(prev => [...prev, snapshot].slice(-maxSize));
    setSnapshotFuture([]); // Clear redo stack on new action
  }, [maxSize]);

  // Push current state to future stack (for undo - enables redo)
  const pushSnapshotToFuture = useCallback((svgInnerHTML: string) => {
    if (!svgInnerHTML) return;
    const snapshot: VisualSnapshot = {
      svgInnerHTML,
      timestamp: Date.now()
    };
    setSnapshotFuture(prev => [snapshot, ...prev].slice(0, maxSize));
  }, [maxSize]);

  // Push current state to past stack (for redo - doesn't clear future)
  const pushSnapshotToPast = useCallback((svgInnerHTML: string) => {
    if (!svgInnerHTML) return;
    const snapshot: VisualSnapshot = {
      svgInnerHTML,
      timestamp: Date.now()
    };
    // Note: does NOT clear snapshotFuture - used during redo operation
    setSnapshotPast(prev => [...prev, snapshot].slice(-maxSize));
  }, [maxSize]);

  const undoSnapshot = useCallback((): VisualSnapshot | null => {
    if (snapshotPast.length === 0) return null;

    const previous = snapshotPast[snapshotPast.length - 1];
    setSnapshotPast(prev => prev.slice(0, -1));
    // Note: caller should call pushSnapshotToFuture with current state before calling this
    return previous;
  }, [snapshotPast]);

  const redoSnapshot = useCallback((): VisualSnapshot | null => {
    if (snapshotFuture.length === 0) return null;

    const next = snapshotFuture[0];
    setSnapshotFuture(prev => prev.slice(1));
    return next;
  }, [snapshotFuture]);

  const clear = useCallback(() => {
    console.log('[useVisualHistory] clear() called - stack trace:', new Error());
    setPast([]);
    setFuture([]);
    setSnapshotPast([]);
    setSnapshotFuture([]);
  }, []);

  return {
    pushState,
    pushSnapshot,
    pushSnapshotToFuture,
    pushSnapshotToPast,
    undo,
    undoSnapshot,
    redo,
    redoSnapshot,
    canUndo: past.length > 0 || snapshotPast.length > 0,
    canRedo: future.length > 0 || snapshotFuture.length > 0,
    clear,
  };
}
