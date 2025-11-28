/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Tests for history/useHistory.ts
 */

import { renderHook, act } from '@testing-library/react';
import { useHistory } from '../history/useHistory';

interface TestState {
  name: string;
  value: number;
}

describe('useHistory', () => {
  const initialState: TestState = { name: 'initial', value: 0 };

  describe('initial state', () => {
    it('should return initial state', () => {
      const { result } = renderHook(() => useHistory(initialState));

      expect(result.current.state).toEqual(initialState);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.index).toBe(0);
      expect(result.current.length).toBe(1);
    });

    it('should use default maxLength', () => {
      const { result } = renderHook(() => useHistory(initialState));

      // Push 60 states (default max is 50)
      for (let i = 1; i <= 60; i++) {
        act(() => {
          result.current.setState({ name: `state-${i}`, value: i });
        });
      }

      // Should be capped at default max history
      expect(result.current.length).toBeLessThanOrEqual(51);
    });

    it('should use custom maxLength', () => {
      const { result } = renderHook(() => useHistory(initialState, 5));

      for (let i = 1; i <= 10; i++) {
        act(() => {
          result.current.setState({ name: `state-${i}`, value: i });
        });
      }

      expect(result.current.length).toBe(5);
    });
  });

  describe('setState', () => {
    it('should update state', () => {
      const { result } = renderHook(() => useHistory(initialState));

      act(() => {
        result.current.setState({ name: 'updated', value: 1 });
      });

      expect(result.current.state).toEqual({ name: 'updated', value: 1 });
    });

    it('should add to history', () => {
      const { result } = renderHook(() => useHistory(initialState));

      act(() => {
        result.current.setState({ name: 'first', value: 1 });
      });

      act(() => {
        result.current.setState({ name: 'second', value: 2 });
      });

      expect(result.current.length).toBe(3);
      expect(result.current.canUndo).toBe(true);
    });
  });

  describe('undo', () => {
    it('should undo to previous state', () => {
      const { result } = renderHook(() => useHistory(initialState));

      act(() => {
        result.current.setState({ name: 'first', value: 1 });
      });

      act(() => {
        result.current.setState({ name: 'second', value: 2 });
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.state).toEqual({ name: 'first', value: 1 });
      expect(result.current.canRedo).toBe(true);
    });

    it('should not undo past initial state', () => {
      const { result } = renderHook(() => useHistory(initialState));

      act(() => {
        result.current.undo();
      });

      expect(result.current.state).toEqual(initialState);
      expect(result.current.canUndo).toBe(false);
    });

    it('should enable canRedo after undo', () => {
      const { result } = renderHook(() => useHistory(initialState));

      act(() => {
        result.current.setState({ name: 'updated', value: 1 });
      });

      expect(result.current.canRedo).toBe(false);

      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);
    });
  });

  describe('redo', () => {
    it('should redo to next state', () => {
      const { result } = renderHook(() => useHistory(initialState));

      act(() => {
        result.current.setState({ name: 'first', value: 1 });
      });

      act(() => {
        result.current.undo();
      });

      act(() => {
        result.current.redo();
      });

      expect(result.current.state).toEqual({ name: 'first', value: 1 });
      expect(result.current.canRedo).toBe(false);
    });

    it('should not redo when at latest state', () => {
      const { result } = renderHook(() => useHistory(initialState));

      act(() => {
        result.current.redo();
      });

      expect(result.current.state).toEqual(initialState);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      const { result } = renderHook(() => useHistory(initialState));

      act(() => {
        result.current.setState({ name: 'first', value: 1 });
      });

      act(() => {
        result.current.setState({ name: 'second', value: 2 });
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.state).toEqual(initialState);
      expect(result.current.length).toBe(1);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('goTo', () => {
    it('should go to specific index', () => {
      const { result } = renderHook(() => useHistory(initialState));

      act(() => {
        result.current.setState({ name: 'first', value: 1 });
      });

      act(() => {
        result.current.setState({ name: 'second', value: 2 });
      });

      act(() => {
        result.current.setState({ name: 'third', value: 3 });
      });

      act(() => {
        result.current.goTo(1);
      });

      expect(result.current.state).toEqual({ name: 'first', value: 1 });
      expect(result.current.index).toBe(1);
    });

    it('should handle out of bounds index', () => {
      const { result } = renderHook(() => useHistory(initialState));

      act(() => {
        result.current.setState({ name: 'first', value: 1 });
      });

      // Go to negative index
      act(() => {
        result.current.goTo(-1);
      });

      expect(result.current.index).toBe(0);

      // Go to index beyond length
      act(() => {
        result.current.goTo(100);
      });

      expect(result.current.index).toBe(1);
    });
  });

  describe('multiple undo/redo', () => {
    it('should handle multiple undo/redo cycles', () => {
      const { result } = renderHook(() => useHistory(initialState));

      // Build up history
      act(() => {
        result.current.setState({ name: 'first', value: 1 });
      });
      act(() => {
        result.current.setState({ name: 'second', value: 2 });
      });
      act(() => {
        result.current.setState({ name: 'third', value: 3 });
      });

      // Undo twice
      act(() => {
        result.current.undo();
      });
      act(() => {
        result.current.undo();
      });

      expect(result.current.state).toEqual({ name: 'first', value: 1 });

      // Redo once
      act(() => {
        result.current.redo();
      });

      expect(result.current.state).toEqual({ name: 'second', value: 2 });

      // New state should clear redo history
      act(() => {
        result.current.setState({ name: 'new', value: 99 });
      });

      expect(result.current.canRedo).toBe(false);
      expect(result.current.state).toEqual({ name: 'new', value: 99 });
    });
  });
});
