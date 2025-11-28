/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @license MIT
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * React hook for state history management
 */

import { useState, useCallback, useRef } from 'react';
import { HistoryManager } from './historyManager';
import { DEFAULT_MAX_HISTORY } from '../core/constants';

/**
 * Hook for managing state history with undo/redo
 *
 * @param initialState - Initial state value
 * @param maxLength - Maximum history length
 * @returns State and history controls
 *
 * @example
 * ```tsx
 * const {
 *   state,
 *   setState,
 *   undo,
 *   redo,
 *   canUndo,
 *   canRedo,
 * } = useHistory({ name: '', email: '' });
 *
 * return (
 *   <div>
 *     <input
 *       value={state.name}
 *       onChange={(e) => setState({ ...state, name: e.target.value })}
 *     />
 *     <button onClick={undo} disabled={!canUndo}>Undo</button>
 *     <button onClick={redo} disabled={!canRedo}>Redo</button>
 *   </div>
 * );
 * ```
 */
export function useHistory<T>(
  initialState: T,
  maxLength: number = DEFAULT_MAX_HISTORY
): {
  state: T;
  setState: (newState: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  index: number;
  length: number;
  reset: () => void;
  goTo: (index: number) => void;
} {
  const managerRef = useRef<HistoryManager<T>>(
    new HistoryManager(initialState, maxLength)
  );

  // Force re-render when history changes
  const [, forceUpdate] = useState({});

  const setState = useCallback((newState: T) => {
    managerRef.current.push(newState);
    forceUpdate({});
  }, []);

  const undo = useCallback(() => {
    managerRef.current.undo();
    forceUpdate({});
  }, []);

  const redo = useCallback(() => {
    managerRef.current.redo();
    forceUpdate({});
  }, []);

  const reset = useCallback(() => {
    managerRef.current.reset(initialState);
    forceUpdate({});
  }, [initialState]);

  const goTo = useCallback((index: number) => {
    managerRef.current.goTo(index);
    forceUpdate({});
  }, []);

  return {
    state: managerRef.current.current,
    setState,
    undo,
    redo,
    canUndo: managerRef.current.canUndo,
    canRedo: managerRef.current.canRedo,
    index: managerRef.current.index,
    length: managerRef.current.length,
    reset,
    goTo,
  };
}
