import { useCallback, useState } from 'react';

interface UseHistoryOptions {
  maxSize?: number;
}

interface UseHistoryReturn {
  value: string;
  setValue: (newValue: string) => void;
  undo: () => void;
  redo: () => void;
  clear: (initialValue: string) => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface HistoryState {
  past: string[];
  present: string;
  future: string[];
}

export function useHistory(initialValue: string, options: UseHistoryOptions = {}): UseHistoryReturn {
  const maxSize = options.maxSize ?? 50;

  const [state, setState] = useState<HistoryState>({
    past: [],
    present: initialValue,
    future: [],
  });

  const setValue = useCallback((newValue: string) => {
    console.log('[useHistory] setValue called');
    setState(prev => {
      console.log('[useHistory] prev.present length:', prev.present.length, 'newValue length:', newValue.length);
      // Don't add to history if value hasn't changed
      if (newValue === prev.present) {
        console.log('[useHistory] Value unchanged, skipping');
        return prev;
      }
      console.log('[useHistory] Adding to history, past will have', prev.past.length + 1, 'entries');
      return {
        past: [...prev.past, prev.present].slice(-maxSize),
        present: newValue,
        future: [], // Clear future on new change
      };
    });
  }, [maxSize]);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const clear = useCallback((value: string) => {
    setState({
      past: [],
      present: value,
      future: [],
    });
  }, []);

  return {
    value: state.present,
    setValue,
    undo,
    redo,
    clear,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
