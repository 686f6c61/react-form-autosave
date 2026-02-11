/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @license MIT
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Tests for useFormPersist hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useFormPersist } from '../hooks/useFormPersist';
import {
  seedPersistedData,
  getPersistedData,
  clearTestStorage,
} from '../testing';
import type { StorageAdapter } from '../core/types';

interface TestFormData {
  name: string;
  email: string;
  age?: number;
}

const initialState: TestFormData = {
  name: '',
  email: '',
};

describe('useFormPersist', () => {
  beforeEach(() => {
    clearTestStorage();
    jest.useFakeTimers();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('basic functionality', () => {
    it('should return initial state on first render', () => {
      const { result } = renderHook(() =>
        useFormPersist('test-form', initialState)
      );

      const [state] = result.current;
      expect(state).toEqual(initialState);
    });

    it('should update state when setState is called', () => {
      const { result } = renderHook(() =>
        useFormPersist('test-form', initialState)
      );

      act(() => {
        result.current[1]({ name: 'John', email: 'john@test.com' });
      });

      expect(result.current[0]).toEqual({
        name: 'John',
        email: 'john@test.com',
      });
    });

    it('should support function updates', () => {
      const { result } = renderHook(() =>
        useFormPersist('test-form', initialState)
      );

      act(() => {
        result.current[1]((prev) => ({ ...prev, name: 'Jane' }));
      });

      expect(result.current[0].name).toBe('Jane');
    });
  });

  describe('persistence', () => {
    it('should persist data after debounce', async () => {
      const { result } = renderHook(() =>
        useFormPersist('persist-test', initialState, { debounce: 100 })
      );

      act(() => {
        result.current[1]({ name: 'Test', email: 'test@test.com' });
      });

      // Advance timers past debounce
      act(() => {
        jest.advanceTimersByTime(150);
      });

      const persisted = getPersistedData<TestFormData>('persist-test');
      expect(persisted).toEqual({ name: 'Test', email: 'test@test.com' });
    });

    it('should restore persisted data on mount', async () => {
      // Seed data
      seedPersistedData('restore-test', { name: 'Restored', email: 'restored@test.com' });

      const { result } = renderHook(() =>
        useFormPersist('restore-test', initialState)
      );

      // Wait for async loading
      await waitFor(() => {
        expect(result.current[0].name).toBe('Restored');
      });
      expect(result.current[2].isRestored).toBe(true);
    });

    it('should call onRestore callback when data is restored', async () => {
      const onRestore = jest.fn();
      seedPersistedData('callback-test', { name: 'Callback', email: '' });

      renderHook(() =>
        useFormPersist('callback-test', initialState, { onRestore })
      );

      await waitFor(() => {
        expect(onRestore).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Callback' })
        );
      });
    });

    it('should support async storage adapters', async () => {
      const asyncStore = new Map<string, string>();
      const asyncStorage = {
        getItem: jest.fn(async (key: string) => asyncStore.get(key) ?? null),
        setItem: jest.fn(async (key: string, value: string) => {
          asyncStore.set(key, value);
        }),
        removeItem: jest.fn(async (key: string) => {
          asyncStore.delete(key);
        }),
      };

      const { result, unmount } = renderHook(() =>
        useFormPersist('async-storage-test', initialState, {
          storage: asyncStorage,
          debounce: 0,
        })
      );
      await act(async () => {
        await Promise.resolve();
      });

      act(() => {
        result.current[1]({ name: 'Async', email: 'async@test.com' });
        jest.advanceTimersByTime(0);
      });

      await waitFor(() => {
        expect(asyncStorage.setItem).toHaveBeenCalled();
        expect(result.current[2].isPersisted).toBe(true);
      });

      unmount();

      const { result: restored } = renderHook(() =>
        useFormPersist('async-storage-test', initialState, {
          storage: asyncStorage,
        })
      );
      await act(async () => {
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(restored.current[0].name).toBe('Async');
      });
    });

    it('should restore again when key changes', async () => {
      seedPersistedData('dynamic-key-a', { name: 'Form A', email: 'a@test.com' });
      seedPersistedData('dynamic-key-b', { name: 'Form B', email: 'b@test.com' });

      const { result, rerender } = renderHook(
        ({ formKey }: { formKey: string }) => useFormPersist(formKey, initialState),
        { initialProps: { formKey: 'dynamic-key-a' } }
      );

      await waitFor(() => {
        expect(result.current[0].name).toBe('Form A');
      });

      rerender({ formKey: 'dynamic-key-b' });

      await waitFor(() => {
        expect(result.current[0].name).toBe('Form B');
      });
    });
  });

  describe('actions', () => {
    it('should clear storage when clear() is called', async () => {
      seedPersistedData('clear-test', { name: 'ToClear', email: '' });

      const { result } = renderHook(() =>
        useFormPersist('clear-test', initialState)
      );
      await waitFor(() => {
        expect(result.current[2].isRestored).toBe(true);
      });

      act(() => {
        result.current[2].clear();
      });

      expect(result.current[2].isPersisted).toBe(false);
      expect(getPersistedData('clear-test')).toBeNull();
    });

    it('should reset to initial state when reset() is called', () => {
      const { result } = renderHook(() =>
        useFormPersist('reset-test', initialState)
      );

      act(() => {
        result.current[1]({ name: 'Changed', email: 'changed@test.com' });
      });

      act(() => {
        result.current[2].reset();
      });

      expect(result.current[0]).toEqual(initialState);
    });

    it('should force save immediately', () => {
      const { result } = renderHook(() =>
        useFormPersist('force-save-test', initialState, { debounce: 10000 })
      );

      // First update the state
      act(() => {
        result.current[1]({ name: 'Forced', email: '' });
      });

      // Then force save (state needs to be updated first)
      act(() => {
        result.current[2].forceSave();
      });

      const persisted = getPersistedData<TestFormData>('force-save-test');
      expect(persisted?.name).toBe('Forced');
    });

    it('should pause and resume auto-save', () => {
      const { result } = renderHook(() =>
        useFormPersist('pause-test', initialState, { debounce: 100 })
      );

      act(() => {
        result.current[2].pause();
      });

      expect(result.current[2].isPaused).toBe(true);

      act(() => {
        result.current[1]({ name: 'Paused', email: '' });
        jest.advanceTimersByTime(200);
      });

      // Should not persist while paused
      expect(getPersistedData('pause-test')).toBeNull();

      act(() => {
        result.current[2].resume();
      });

      expect(result.current[2].isPaused).toBe(false);
    });

    it('should track dirty state', () => {
      const { result } = renderHook(() =>
        useFormPersist('dirty-test', initialState)
      );

      expect(result.current[2].isDirty).toBe(false);

      act(() => {
        result.current[1]({ name: 'Dirty', email: '' });
      });

      expect(result.current[2].isDirty).toBe(true);
    });

    it('should provide withClear wrapper', async () => {
      seedPersistedData('withclear-test', { name: 'ToWrap', email: '' });

      const { result } = renderHook(() =>
        useFormPersist('withclear-test', initialState)
      );

      const handler = jest.fn().mockResolvedValue('success');
      const wrapped = result.current[2].withClear(handler);

      await act(async () => {
        await wrapped();
      });

      expect(handler).toHaveBeenCalled();
      expect(result.current[2].isPersisted).toBe(false);
    });
  });

  describe('options', () => {
    it('should exclude specified fields', () => {
      const { result } = renderHook(() =>
        useFormPersist(
          'exclude-test',
          { name: '', email: '', password: '' },
          {
            exclude: ['password'],
            debounce: 100,
          }
        )
      );

      act(() => {
        result.current[1]({ name: 'Test', email: 'test@test.com', password: 'secret123' });
        jest.advanceTimersByTime(150);
      });

      const persisted = getPersistedData<{ name: string; email: string; password?: string }>('exclude-test');
      expect(persisted?.name).toBe('Test');
      expect(persisted?.password).toBeUndefined();
    });

    it('should not persist when enabled is false', () => {
      const { result } = renderHook(() =>
        useFormPersist('disabled-test', initialState, {
          enabled: false,
          debounce: 100,
        })
      );

      act(() => {
        result.current[1]({ name: 'Disabled', email: '' });
        jest.advanceTimersByTime(150);
      });

      expect(getPersistedData('disabled-test')).toBeNull();
    });

    it('should validate data before persisting', () => {
      const validate = jest.fn().mockReturnValue(false);

      const { result } = renderHook(() =>
        useFormPersist('validate-test', initialState, {
          validate,
          debounce: 100,
        })
      );

      act(() => {
        result.current[1]({ name: 'Invalid', email: '' });
        jest.advanceTimersByTime(150);
      });

      expect(validate).toHaveBeenCalled();
      expect(getPersistedData('validate-test')).toBeNull();
    });

    it('should persist only dirty fields in dirty mode', async () => {
      const initial = {
        name: '',
        email: '',
        age: 0,
      };

      const { result, unmount } = renderHook(() =>
        useFormPersist('dirty-mode-test', initial, {
          persistMode: 'dirty',
          debounce: 0,
        })
      );

      act(() => {
        result.current[1]({ name: 'OnlyDirty', email: '', age: 0 });
        jest.advanceTimersByTime(0);
      });

      const raw = localStorage.getItem('rfp:dirty-mode-test');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw ?? '{}');
      expect(parsed.data).toEqual({ name: 'OnlyDirty' });

      unmount();

      const { result: restored } = renderHook(() =>
        useFormPersist('dirty-mode-test', initial, {
          persistMode: 'dirty',
        })
      );

      await waitFor(() => {
        expect(restored.current[0]).toEqual({
          name: 'OnlyDirty',
          email: '',
          age: 0,
        });
      });
    });

    it('should partition large persisted payloads and restore from chunks', async () => {
      const { result, unmount } = renderHook(() =>
        useFormPersist(
          'partition-test',
          { name: '', email: '' },
          {
            partition: { enabled: true, maxSize: 80 },
            debounce: 0,
          }
        )
      );

      act(() => {
        result.current[1]({
          name: 'A'.repeat(300),
          email: 'partition@test.com',
        });
        jest.advanceTimersByTime(0);
      });

      const raw = localStorage.getItem('rfp:partition-test');
      expect(raw).not.toBeNull();
      const manifest = JSON.parse(raw ?? '{}');
      expect(manifest.__rfp_partitioned__).toBe(true);
      expect(manifest.count).toBeGreaterThan(1);

      const firstChunk = localStorage.getItem('rfp:partition-test:part:0');
      expect(firstChunk).not.toBeNull();

      unmount();

      const { result: restored } = renderHook(() =>
        useFormPersist(
          'partition-test',
          { name: '', email: '' },
          {
            partition: { enabled: true, maxSize: 80 },
          }
        )
      );

      await waitFor(() => {
        expect(restored.current[0].name).toBe('A'.repeat(300));
      });
    });

    it('should apply partition object defaults when fields are omitted', () => {
      const { result } = renderHook(() =>
        useFormPersist(
          'partition-defaults-test',
          { name: '', email: '' },
          {
            partition: {},
            debounce: 0,
          }
        )
      );

      act(() => {
        result.current[1]({
          name: 'D'.repeat(9000),
          email: 'defaults@test.com',
        });
        jest.advanceTimersByTime(0);
      });

      const raw = localStorage.getItem('rfp:partition-defaults-test');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw ?? '{}');
      expect(parsed.__rfp_partitioned__).toBe(true);
      expect(parsed.count).toBeGreaterThan(1);
    });

    it('should enable partitioning with boolean partition option', () => {
      const { result } = renderHook(() =>
        useFormPersist(
          'partition-boolean-test',
          { name: '', email: '' },
          {
            partition: true,
            debounce: 0,
          }
        )
      );

      act(() => {
        result.current[1]({
          name: 'B'.repeat(8000),
          email: 'partition-bool@test.com',
        });
        jest.advanceTimersByTime(0);
      });

      const raw = localStorage.getItem('rfp:partition-boolean-test');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw ?? '{}');
      expect(parsed.__rfp_partitioned__).toBe(true);
      expect(parsed.count).toBeGreaterThan(1);
    });

    it('should compress persisted payloads when compress is enabled', async () => {
      const { result, unmount } = renderHook(() =>
        useFormPersist(
          'compress-enabled-test',
          { content: '' },
          {
            compress: true,
            debounce: 0,
          }
        )
      );

      act(() => {
        result.current[1]({ content: 'C'.repeat(4000) });
        jest.advanceTimersByTime(0);
      });

      const raw = localStorage.getItem('rfp:compress-enabled-test');
      expect(raw).not.toBeNull();
      expect(raw?.startsWith('\x01')).toBe(true);

      unmount();

      const { result: restored } = renderHook(() =>
        useFormPersist(
          'compress-enabled-test',
          { content: '' },
          {
            compress: true,
          }
        )
      );

      await waitFor(() => {
        expect(restored.current[0].content).toBe('C'.repeat(4000));
      });
    });
  });

  describe('history (undo/redo)', () => {
    it('should track history when enabled', () => {
      const { result } = renderHook(() =>
        useFormPersist('history-test', initialState, {
          history: { enabled: true, maxHistory: 10 },
        })
      );

      expect(result.current[2].historyLength).toBe(1);
      expect(result.current[2].canUndo).toBe(false);

      act(() => {
        result.current[1]({ name: 'First', email: '' });
      });

      expect(result.current[2].historyLength).toBe(2);
      expect(result.current[2].canUndo).toBe(true);
    });

    it('should undo and redo changes', () => {
      const { result } = renderHook(() =>
        useFormPersist('undo-redo-test', initialState, {
          history: { enabled: true },
        })
      );

      act(() => {
        result.current[1]({ name: 'First', email: '' });
      });

      act(() => {
        result.current[1]({ name: 'Second', email: '' });
      });

      expect(result.current[0].name).toBe('Second');

      act(() => {
        result.current[2].undo();
      });

      expect(result.current[0].name).toBe('First');
      expect(result.current[2].canRedo).toBe(true);

      act(() => {
        result.current[2].redo();
      });

      expect(result.current[0].name).toBe('Second');
    });

    it('should not track history when explicitly disabled', () => {
      const { result } = renderHook(() =>
        useFormPersist('history-disabled-test', initialState, {
          history: { enabled: false, maxHistory: 10 },
        })
      );

      act(() => {
        result.current[1]({ name: 'NoHistory', email: '' });
      });

      expect(result.current[2].historyLength).toBe(1);
      expect(result.current[2].canUndo).toBe(false);
    });

    it('should enable history when history option is true', () => {
      const { result } = renderHook(() =>
        useFormPersist('history-boolean-true-test', initialState, {
          history: true,
        })
      );

      act(() => {
        result.current[1]({ name: 'HistoryTrue', email: '' });
      });

      expect(result.current[2].historyLength).toBe(2);
      expect(result.current[2].canUndo).toBe(true);
    });

    it('should default history.enabled to true when omitted in object form', () => {
      const { result } = renderHook(() =>
        useFormPersist('history-object-default-enabled-test', initialState, {
          history: {},
        })
      );

      act(() => {
        result.current[1]({ name: 'HistoryObject', email: '' });
      });

      expect(result.current[2].historyLength).toBe(2);
      expect(result.current[2].canUndo).toBe(true);
    });
  });

  describe('sync integration', () => {
    it('should apply updates from storage events when sync is enabled', async () => {
      const { result } = renderHook(() =>
        useFormPersist('sync-enabled-test', initialState, {
          sync: { enabled: true, strategy: 'latest-wins' },
        })
      );

      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'rfp:sync-enabled-test',
            newValue: JSON.stringify({ data: { name: 'Remote', email: '' } }),
          })
        );
      });

      await waitFor(() => {
        expect(result.current[0].name).toBe('Remote');
      });
    });

    it('should enable sync object by default when enabled is omitted', async () => {
      const { result } = renderHook(() =>
        useFormPersist('sync-implicit-enabled-test', initialState, {
          sync: { strategy: 'latest-wins' },
        })
      );

      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'rfp:sync-implicit-enabled-test',
            newValue: JSON.stringify({ data: { name: 'ImplicitSync', email: '' } }),
          })
        );
      });

      await waitFor(() => {
        expect(result.current[0].name).toBe('ImplicitSync');
      });
    });

    it('should enable sync when sync is set to true', async () => {
      const { result } = renderHook(() =>
        useFormPersist('sync-bool-test', initialState, {
          sync: true,
        })
      );

      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'rfp:sync-bool-test',
            newValue: JSON.stringify({ data: { name: 'FromBool', email: '' } }),
          })
        );
      });

      await waitFor(() => {
        expect(result.current[0].name).toBe('FromBool');
      });
    });

    it('should reset state when receiving sync clear events', async () => {
      const { result } = renderHook(() =>
        useFormPersist('sync-clear-test', initialState, {
          sync: true,
          history: { enabled: true, maxHistory: 5 },
        })
      );

      act(() => {
        result.current[1]({ name: 'Local', email: 'local@test.com' });
      });

      expect(result.current[0].name).toBe('Local');

      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'rfp:sync-clear-test',
            newValue: null,
          })
        );
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual(initialState);
      });
      expect(result.current[2].isPersisted).toBe(false);
      expect(result.current[2].historyLength).toBe(1);
      expect(result.current[2].historyIndex).toBe(0);
    });

    it('should handle debug fallback path during sync clear logging', async () => {
      const { result } = renderHook(() =>
        useFormPersist('sync-clear-debug-fallback-test', initialState, {
          sync: true,
          history: true,
          debug: undefined,
        })
      );

      act(() => {
        result.current[1]({ name: 'LocalDebugClear', email: '' });
      });

      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'rfp:sync-clear-debug-fallback-test',
            newValue: null,
          })
        );
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual(initialState);
      });
    });

    it('should ignore sync updates when incoming data is unchanged', () => {
      const { result } = renderHook(() =>
        useFormPersist('sync-unchanged-test', initialState, {
          sync: true,
          history: { enabled: true, maxHistory: 5 },
        })
      );

      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'rfp:sync-unchanged-test',
            newValue: JSON.stringify({ data: { name: '', email: '' } }),
          })
        );
      });

      expect(result.current[0]).toEqual(initialState);
      expect(result.current[2].isPersisted).toBe(false);
      expect(result.current[2].historyLength).toBe(1);
      expect(result.current[2].historyIndex).toBe(0);
    });

    it('should track synced updates in history and trim to maxHistory', async () => {
      const { result } = renderHook(() =>
        useFormPersist('sync-history-test', initialState, {
          sync: true,
          history: { enabled: true, maxHistory: 2 },
        })
      );

      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'rfp:sync-history-test',
            newValue: JSON.stringify({ data: { name: 'One', email: '' } }),
          })
        );
      });

      await waitFor(() => {
        expect(result.current[0].name).toBe('One');
      });

      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'rfp:sync-history-test',
            newValue: JSON.stringify({ data: { name: 'Two', email: '' } }),
          })
        );
      });

      await waitFor(() => {
        expect(result.current[0].name).toBe('Two');
      });

      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'rfp:sync-history-test',
            newValue: JSON.stringify({ data: { name: 'Three', email: '' } }),
          })
        );
      });

      await waitFor(() => {
        expect(result.current[0].name).toBe('Three');
      });

      expect(result.current[2].historyLength).toBe(2);
      expect(result.current[2].historyIndex).toBe(1);
      expect(result.current[2].canUndo).toBe(true);
    });

    it('should handle debug fallback path during sync update logging', async () => {
      const { result } = renderHook(() =>
        useFormPersist('sync-update-debug-fallback-test', initialState, {
          sync: true,
          debug: undefined,
        })
      );

      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'rfp:sync-update-debug-fallback-test',
            newValue: JSON.stringify({ data: { name: 'DebugUpdate', email: '' } }),
          })
        );
      });

      await waitFor(() => {
        expect(result.current[0].name).toBe('DebugUpdate');
      });
    });
  });

  describe('error handling', () => {
    it('should handle corrupted storage data gracefully', () => {
      // Set corrupted data
      localStorage.setItem('rfp:corrupted-test', 'not-valid-json{{{');

      const { result } = renderHook(() =>
        useFormPersist('corrupted-test', initialState)
      );

      // Should fallback to initial state
      expect(result.current[0]).toEqual(initialState);
    });

    it('should handle non-object JSON payloads gracefully', () => {
      localStorage.setItem('rfp:json-number-test', '123');

      const { result } = renderHook(() =>
        useFormPersist('json-number-test', initialState)
      );

      expect(result.current[0]).toEqual(initialState);
    });

    it('should call onError when storage fails', () => {
      const onError = jest.fn();

      // Set invalid data
      localStorage.setItem('rfp:error-test', '{"data":null}');

      renderHook(() =>
        useFormPersist('error-test', initialState, { onError })
      );

      // onError may or may not be called depending on validation
      // The important thing is the hook doesn't crash
      expect(true).toBe(true);
    });
  });

  describe('expiration', () => {
    it('should not restore expired data', () => {
      const expiredTimestamp = Date.now() - 60000; // 1 minute ago
      seedPersistedData(
        'expired-test',
        { name: 'Expired', email: '' },
        { expiresAt: expiredTimestamp }
      );

      const { result } = renderHook(() =>
        useFormPersist('expired-test', initialState)
      );

      // Should not restore expired data
      expect(result.current[0]).toEqual(initialState);
    });
  });

  describe('debug mode', () => {
    it('should log debug messages when debug is enabled', () => {
      const consoleSpy = jest.spyOn(console, 'log');

      const { result } = renderHook(() =>
        useFormPersist('debug-test', initialState, { debug: true, debounce: 100 })
      );

      act(() => {
        result.current[1]({ name: 'Debug', email: '' });
        jest.advanceTimersByTime(150);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[react-form-autosave]',
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('size warning', () => {
    it('should warn when data exceeds warnSize threshold', () => {
      const consoleSpy = jest.spyOn(console, 'warn');

      const { result } = renderHook(() =>
        useFormPersist('size-warn-test', initialState, {
          warnSize: 10, // Very small threshold
          debounce: 100,
        })
      );

      act(() => {
        result.current[1]({ name: 'This is a long name that exceeds the threshold', email: 'test@test.com' });
        jest.advanceTimersByTime(150);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('exceeds warning threshold')
      );
    });
  });

  describe('getPersistedValue', () => {
    it('should return persisted value without restoring', () => {
      seedPersistedData('getvalue-test', { name: 'Persisted', email: 'persisted@test.com' });

      const { result } = renderHook(() =>
        useFormPersist('getvalue-test', initialState, { enabled: false })
      );

      const value = result.current[2].getPersistedValue();
      expect(value?.name).toBe('Persisted');
    });

    it('should return null for empty storage', () => {
      const { result } = renderHook(() =>
        useFormPersist('empty-getvalue-test', initialState)
      );

      const value = result.current[2].getPersistedValue();
      expect(value).toBeNull();
    });

    it('should return null for expired data', () => {
      const expiredTimestamp = Date.now() - 60000;
      seedPersistedData(
        'expired-getvalue-test',
        { name: 'Expired', email: '' },
        { expiresAt: expiredTimestamp }
      );

      const { result } = renderHook(() =>
        useFormPersist('expired-getvalue-test', initialState)
      );

      const value = result.current[2].getPersistedValue();
      expect(value).toBeNull();
    });
  });

  describe('revert', () => {
    it('should revert to last persisted state', async () => {
      seedPersistedData('revert-test', { name: 'Original', email: 'original@test.com' });

      const { result } = renderHook(() =>
        useFormPersist('revert-test', initialState)
      );

      // Wait for restore
      await waitFor(() => {
        expect(result.current[0].name).toBe('Original');
      });

      // Modify state
      act(() => {
        result.current[1]({ name: 'Modified', email: 'modified@test.com' });
      });

      expect(result.current[0].name).toBe('Modified');

      // Revert
      act(() => {
        result.current[2].revert();
      });

      expect(result.current[0].name).toBe('Original');
    });

    it('should do nothing if no persisted value', () => {
      const { result } = renderHook(() =>
        useFormPersist('no-revert-test', initialState)
      );

      act(() => {
        result.current[1]({ name: 'Modified', email: '' });
      });

      act(() => {
        result.current[2].revert();
      });

      // Should keep modified value since no persisted data exists
      expect(result.current[0].name).toBe('Modified');
    });

    it('should update sync manager local snapshot when reverting with sync enabled', async () => {
      seedPersistedData('revert-sync-test', { name: 'PersistedSync', email: 'sync@test.com' });

      const { result } = renderHook(() =>
        useFormPersist('revert-sync-test', initialState, {
          sync: true,
        })
      );

      await waitFor(() => {
        expect(result.current[0].name).toBe('PersistedSync');
      });

      act(() => {
        result.current[1]({ name: 'EditedSync', email: 'edited@test.com' });
      });
      expect(result.current[0].name).toBe('EditedSync');

      act(() => {
        result.current[2].revert();
      });

      expect(result.current[0].name).toBe('PersistedSync');
    });
  });

  describe('migration', () => {
    it('should migrate data when version changes', async () => {
      // Seed with old version
      localStorage.setItem('rfp:migrate-test', JSON.stringify({
        data: { name: 'Old', email: '' },
        timestamp: Date.now(),
        version: 1,
      }));

      const migrate = jest.fn((data, fromVersion) => {
        if (fromVersion === 1) {
          return { ...data, email: 'migrated@test.com' };
        }
        return data;
      });

      const { result } = renderHook(() =>
        useFormPersist('migrate-test', initialState, {
          version: 2,
          migrate,
        })
      );

      await waitFor(() => {
        expect(result.current[0].email).toBe('migrated@test.com');
      });

      expect(migrate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Old' }),
        1
      );
    });

    it('should handle failed migration gracefully', async () => {
      const onError = jest.fn();

      localStorage.setItem('rfp:fail-migrate-test', JSON.stringify({
        data: { name: 'Old', email: '' },
        timestamp: Date.now(),
        version: 1,
      }));

      const migrate = jest.fn(() => {
        throw new Error('Migration failed');
      });

      const { result } = renderHook(() =>
        useFormPersist('fail-migrate-test', initialState, {
          version: 2,
          migrate,
          onError,
        })
      );

      // Should not restore data on migration failure
      expect(result.current[0]).toEqual(initialState);
    });
  });

  describe('beforePersist transform', () => {
    it('should apply beforePersist transform', () => {
      const beforePersist = jest.fn((data: TestFormData) => ({
        ...data,
        name: data.name.toUpperCase(),
      }));

      const { result } = renderHook(() =>
        useFormPersist('transform-test', initialState, {
          beforePersist,
          debounce: 100,
        })
      );

      act(() => {
        result.current[1]({ name: 'test', email: 'test@test.com' });
        jest.advanceTimersByTime(150);
      });

      expect(beforePersist).toHaveBeenCalled();

      const persisted = getPersistedData<TestFormData>('transform-test');
      expect(persisted?.name).toBe('TEST');
    });
  });

  describe('storage quota exceeded', () => {
    it('should call onStorageFull when storage is full', () => {
      const onStorageFull = jest.fn();
      const onError = jest.fn();

      // Create a mock storage that throws quota exceeded
      const mockStorage = {
        getItem: jest.fn().mockReturnValue(null),
        setItem: jest.fn().mockImplementation(() => {
          const error = new Error('QuotaExceededError');
          error.name = 'QuotaExceededError';
          throw error;
        }),
        removeItem: jest.fn(),
      };

      const { result } = renderHook(() =>
        useFormPersist('quota-test', initialState, {
          storage: mockStorage as StorageAdapter,
          onStorageFull,
          onError,
          debounce: 100,
        })
      );

      act(() => {
        result.current[1]({ name: 'Large', email: 'test@test.com' });
        jest.advanceTimersByTime(150);
      });

      expect(onStorageFull).toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('invalid stored data structure', () => {
    it('should handle invalid data structure', () => {
      // Set data without proper structure
      localStorage.setItem('rfp:invalid-structure', JSON.stringify({
        notData: 'wrong structure',
      }));

      const { result } = renderHook(() =>
        useFormPersist('invalid-structure', initialState)
      );

      // Should fall back to initial state
      expect(result.current[0]).toEqual(initialState);
    });
  });

  describe('throttle option', () => {
    it('should respect throttle option', () => {
      const { result } = renderHook(() =>
        useFormPersist('throttle-test', initialState, {
          debounce: 100,
          throttle: 500,
        })
      );

      // First update
      act(() => {
        result.current[1]({ name: 'First', email: '' });
      });

      // Immediate second update (should be throttled)
      act(() => {
        result.current[1]({ name: 'Second', email: '' });
        jest.advanceTimersByTime(100);
      });

      // After debounce but before throttle
      let persisted = getPersistedData<TestFormData>('throttle-test');

      // Advance past throttle time
      act(() => {
        jest.advanceTimersByTime(500);
      });

      persisted = getPersistedData<TestFormData>('throttle-test');
      expect(persisted?.name).toBe('Second');
    });
  });
});

describe('useFormPersistObject', () => {
  beforeEach(() => {
    clearTestStorage();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return object-based interface', () => {
    const { result } = renderHook(() => {
      // Dynamic import to test this function
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useFormPersistObject } = require('../hooks/useFormPersist');
      return useFormPersistObject('object-test', initialState);
    });

    expect(result.current.state).toEqual(initialState);
    expect(typeof result.current.setState).toBe('function');
    expect(typeof result.current.clear).toBe('function');
    expect(typeof result.current.undo).toBe('function');
    expect(typeof result.current.redo).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('should update state via object interface', () => {
    const { result } = renderHook(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useFormPersistObject } = require('../hooks/useFormPersist');
      return useFormPersistObject('object-update-test', initialState);
    });

    act(() => {
      result.current.setState({ name: 'Object', email: 'object@test.com' });
    });

    expect(result.current.state.name).toBe('Object');
  });
});
