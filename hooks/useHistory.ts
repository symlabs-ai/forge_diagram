import { useCallback, useReducer, useRef } from 'react';
import type { DiagramHistory } from '../types';

type HistoryAction =
  | { type: 'SET'; value: string }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR'; value: string };

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

function historyReducer(state: DiagramHistory, action: HistoryAction): DiagramHistory {
  switch (action.type) {
    case 'SET': {
      // Don't add to history if value hasn't changed
      if (action.value === state.present) {
        return state;
      }
      return {
        past: [...state.past, state.present].slice(-50), // Keep max 50 history items
        present: action.value,
        future: [],
      };
    }
    case 'UNDO': {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future],
      };
    }
    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        past: [...state.past, state.present],
        present: next,
        future: newFuture,
      };
    }
    case 'CLEAR': {
      return {
        past: [],
        present: action.value,
        future: [],
      };
    }
    default:
      return state;
  }
}

export function useHistory(initialValue: string, _options: UseHistoryOptions = {}): UseHistoryReturn {
  const [state, dispatch] = useReducer(historyReducer, {
    past: [],
    present: initialValue,
    future: [],
  });

  // Debounce history updates to avoid flooding with keystrokes
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingValueRef = useRef<string | null>(null);

  const setValue = useCallback((newValue: string) => {
    pendingValueRef.current = newValue;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (pendingValueRef.current !== null) {
        dispatch({ type: 'SET', value: pendingValueRef.current });
        pendingValueRef.current = null;
      }
    }, 500); // 500ms debounce for history
  }, []);

  const undo = useCallback(() => {
    // Clear any pending debounced update before undo
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
      pendingValueRef.current = null;
    }
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const clear = useCallback((value: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
      pendingValueRef.current = null;
    }
    dispatch({ type: 'CLEAR', value });
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
