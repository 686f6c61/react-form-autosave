/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Tests for history/historyManager.ts
 */

import { HistoryManager, createHistoryManager } from '../history/historyManager';

describe('historyManager', () => {
  describe('HistoryManager', () => {
    it('should initialize with initial state', () => {
      const history = new HistoryManager({ name: '' });

      expect(history.current).toEqual({ name: '' });
      expect(history.index).toBe(0);
      expect(history.length).toBe(1);
    });

    it('should initialize with custom max length', () => {
      const history = new HistoryManager({ name: '' }, 10);
      const snapshot = history.getSnapshot();

      expect(snapshot.maxLength).toBe(10);
    });

    describe('push', () => {
      it('should add new state to history', () => {
        const history = new HistoryManager({ name: '' });
        history.push({ name: 'John' });

        expect(history.current).toEqual({ name: 'John' });
        expect(history.length).toBe(2);
        expect(history.index).toBe(1);
      });

      it('should clear forward history when pushing', () => {
        const history = new HistoryManager({ name: '' });
        history.push({ name: 'A' });
        history.push({ name: 'B' });
        history.undo();
        history.push({ name: 'C' });

        expect(history.length).toBe(3);
        expect(history.current).toEqual({ name: 'C' });
        expect(history.canRedo).toBe(false);
      });

      it('should trim history when exceeding max length', () => {
        const history = new HistoryManager({ name: '0' }, 3);
        history.push({ name: '1' });
        history.push({ name: '2' });
        history.push({ name: '3' });

        expect(history.length).toBe(3);
        expect(history.getAll()[0]).toEqual({ name: '1' });
      });
    });

    describe('undo', () => {
      it('should go back one state', () => {
        const history = new HistoryManager({ name: '' });
        history.push({ name: 'John' });
        const result = history.undo();

        expect(result).toEqual({ name: '' });
        expect(history.current).toEqual({ name: '' });
        expect(history.index).toBe(0);
      });

      it('should not go beyond first state', () => {
        const history = new HistoryManager({ name: '' });
        const result = history.undo();

        expect(result).toEqual({ name: '' });
        expect(history.index).toBe(0);
      });

      it('should return current when cannot undo', () => {
        const history = new HistoryManager({ name: 'initial' });
        const result = history.undo();

        expect(result).toEqual({ name: 'initial' });
      });
    });

    describe('redo', () => {
      it('should go forward one state', () => {
        const history = new HistoryManager({ name: '' });
        history.push({ name: 'John' });
        history.undo();
        const result = history.redo();

        expect(result).toEqual({ name: 'John' });
        expect(history.index).toBe(1);
      });

      it('should not go beyond last state', () => {
        const history = new HistoryManager({ name: '' });
        history.push({ name: 'John' });
        const result = history.redo();

        expect(result).toEqual({ name: 'John' });
        expect(history.index).toBe(1);
      });

      it('should return current when cannot redo', () => {
        const history = new HistoryManager({ name: 'initial' });
        const result = history.redo();

        expect(result).toEqual({ name: 'initial' });
      });
    });

    describe('canUndo and canRedo', () => {
      it('should report canUndo correctly', () => {
        const history = new HistoryManager({ name: '' });

        expect(history.canUndo).toBe(false);

        history.push({ name: 'John' });
        expect(history.canUndo).toBe(true);

        history.undo();
        expect(history.canUndo).toBe(false);
      });

      it('should report canRedo correctly', () => {
        const history = new HistoryManager({ name: '' });
        history.push({ name: 'John' });

        expect(history.canRedo).toBe(false);

        history.undo();
        expect(history.canRedo).toBe(true);

        history.redo();
        expect(history.canRedo).toBe(false);
      });
    });

    describe('goTo', () => {
      it('should navigate to specific index', () => {
        const history = new HistoryManager({ name: '0' });
        history.push({ name: '1' });
        history.push({ name: '2' });
        history.push({ name: '3' });

        const result = history.goTo(1);

        expect(result).toEqual({ name: '1' });
        expect(history.index).toBe(1);
      });

      it('should clamp to valid range', () => {
        const history = new HistoryManager({ name: '0' });
        history.push({ name: '1' });

        history.goTo(-10);
        expect(history.index).toBe(0);

        history.goTo(100);
        expect(history.index).toBe(1);
      });
    });

    describe('reset', () => {
      it('should reset history with new initial state', () => {
        const history = new HistoryManager({ name: '' });
        history.push({ name: 'A' });
        history.push({ name: 'B' });

        history.reset({ name: 'New' });

        expect(history.current).toEqual({ name: 'New' });
        expect(history.length).toBe(1);
        expect(history.index).toBe(0);
      });
    });

    describe('getAll', () => {
      it('should return all states', () => {
        const history = new HistoryManager({ name: '0' });
        history.push({ name: '1' });
        history.push({ name: '2' });

        const all = history.getAll();

        expect(all).toEqual([
          { name: '0' },
          { name: '1' },
          { name: '2' },
        ]);
      });

      it('should return a copy of states array', () => {
        const history = new HistoryManager({ name: '0' });
        const all = history.getAll();

        all.push({ name: 'modified' });

        expect(history.length).toBe(1);
      });
    });

    describe('getSnapshot', () => {
      it('should return snapshot of current state', () => {
        const history = new HistoryManager({ name: '0' }, 25);
        history.push({ name: '1' });

        const snapshot = history.getSnapshot();

        expect(snapshot.states).toEqual([{ name: '0' }, { name: '1' }]);
        expect(snapshot.index).toBe(1);
        expect(snapshot.maxLength).toBe(25);
      });

      it('should return a copy of states', () => {
        const history = new HistoryManager({ name: '0' });
        const snapshot = history.getSnapshot();

        snapshot.states.push({ name: 'modified' });

        expect(history.length).toBe(1);
      });
    });
  });

  describe('createHistoryManager', () => {
    it('should create a new HistoryManager instance', () => {
      const history = createHistoryManager({ name: '' });

      expect(history).toBeInstanceOf(HistoryManager);
      expect(history.current).toEqual({ name: '' });
    });

    it('should accept custom max length', () => {
      const history = createHistoryManager({ name: '' }, 10);
      const snapshot = history.getSnapshot();

      expect(snapshot.maxLength).toBe(10);
    });
  });
});
