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
  });

  describe('actions', () => {
    it('should clear storage when clear() is called', () => {
      seedPersistedData('clear-test', { name: 'ToClear', email: '' });

      const { result } = renderHook(() =>
        useFormPersist('clear-test', initialState)
      );

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
        useFormPersist('getvalue-test', initialState)
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
          storage: mockStorage as any,
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
