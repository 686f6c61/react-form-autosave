/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @license MIT
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * History manager for undo/redo functionality
 * Provides a state history stack with navigation
 */

import { DEFAULT_MAX_HISTORY } from '../core/constants';

/**
 * History state structure
 */
export interface HistoryState<T> {
  /** Array of historical states */
  states: T[];
  /** Current position in history (0-indexed) */
  index: number;
  /** Maximum number of states to keep */
  maxLength: number;
}

/**
 * History manager class
 *
 * @example
 * ```typescript
 * const history = new HistoryManager<FormData>({ name: '' }, 50);
 *
 * // Add state
 * history.push({ name: 'John' });
 * history.push({ name: 'John Doe' });
 *
 * // Navigate
 * if (history.canUndo) {
 *   history.undo(); // Back to { name: 'John' }
 * }
 *
 * if (history.canRedo) {
 *   history.redo(); // Forward to { name: 'John Doe' }
 * }
 * ```
 */
export class HistoryManager<T> {
  private state: HistoryState<T>;

  constructor(initialState: T, maxLength: number = DEFAULT_MAX_HISTORY) {
    this.state = {
      states: [initialState],
      index: 0,
      maxLength,
    };
  }

  /**
   * Get current state
   */
  get current(): T {
    return this.state.states[this.state.index];
  }

  /**
   * Get current history index
   */
  get index(): number {
    return this.state.index;
  }

  /**
   * Get total history length
   */
  get length(): number {
    return this.state.states.length;
  }

  /**
   * Check if undo is available
   */
  get canUndo(): boolean {
    return this.state.index > 0;
  }

  /**
   * Check if redo is available
   */
  get canRedo(): boolean {
    return this.state.index < this.state.states.length - 1;
  }

  /**
   * Push a new state onto the history stack
   * Clears any forward history (redo states)
   *
   * @param newState - The new state to add
   */
  push(newState: T): void {
    // Remove forward history
    const newStates = this.state.states.slice(0, this.state.index + 1);

    // Add new state
    newStates.push(newState);

    // Trim to max length
    if (newStates.length > this.state.maxLength) {
      newStates.shift();
    }

    this.state = {
      ...this.state,
      states: newStates,
      index: newStates.length - 1,
    };
  }

  /**
   * Go back one state
   *
   * @returns The previous state, or current if can't go back
   */
  undo(): T {
    if (!this.canUndo) {
      return this.current;
    }

    this.state = {
      ...this.state,
      index: this.state.index - 1,
    };

    return this.current;
  }

  /**
   * Go forward one state
   *
   * @returns The next state, or current if can't go forward
   */
  redo(): T {
    if (!this.canRedo) {
      return this.current;
    }

    this.state = {
      ...this.state,
      index: this.state.index + 1,
    };

    return this.current;
  }

  /**
   * Go to a specific index in history
   *
   * @param targetIndex - The index to navigate to
   * @returns The state at that index
   */
  goTo(targetIndex: number): T {
    const clampedIndex = Math.max(0, Math.min(targetIndex, this.state.states.length - 1));

    this.state = {
      ...this.state,
      index: clampedIndex,
    };

    return this.current;
  }

  /**
   * Clear all history and reset to initial state
   *
   * @param newInitialState - The new initial state
   */
  reset(newInitialState: T): void {
    this.state = {
      ...this.state,
      states: [newInitialState],
      index: 0,
    };
  }

  /**
   * Get all states in history
   *
   * @returns Array of all states
   */
  getAll(): T[] {
    return [...this.state.states];
  }

  /**
   * Get a snapshot of the current history state
   *
   * @returns History state object
   */
  getSnapshot(): HistoryState<T> {
    return {
      states: [...this.state.states],
      index: this.state.index,
      maxLength: this.state.maxLength,
    };
  }
}

/**
 * Create a new history manager
 *
 * @param initialState - The initial state
 * @param maxLength - Maximum history length
 * @returns HistoryManager instance
 */
export function createHistoryManager<T>(
  initialState: T,
  maxLength: number = DEFAULT_MAX_HISTORY
): HistoryManager<T> {
  return new HistoryManager(initialState, maxLength);
}
