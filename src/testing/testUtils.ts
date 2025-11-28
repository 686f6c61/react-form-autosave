/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @license MIT
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Testing utilities for testing forms with react-form-autosave
 */

import React from 'react';
import type { StorageAdapter } from '../core/types';
import { DEFAULT_KEY_PREFIX } from '../core/constants';

/**
 * Mock storage implementation for testing
 *
 * @example
 * ```typescript
 * const storage = createMockStorage();
 *
 * // Use in tests
 * const { result } = renderHook(() =>
 *   useFormPersist('test', { name: '' }, { storage })
 * );
 *
 * // Assert on storage calls
 * expect(storage.setItem).toHaveBeenCalled();
 * ```
 */
export function createMockStorage(): StorageAdapter & {
  store: Map<string, string>;
  getItem: jest.Mock;
  setItem: jest.Mock;
  removeItem: jest.Mock;
  clear: () => void;
} {
  const store = new Map<string, string>();

  const mockStorage = {
    store,
    getItem: jest.fn((key: string) => store.get(key) ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: jest.fn((key: string) => {
      store.delete(key);
    }),
    clear: () => {
      store.clear();
    },
  };

  return mockStorage;
}

/**
 * Pre-populate storage with form data for testing restoration
 *
 * @param key - Form key (without prefix)
 * @param data - Data to store
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * // Setup persisted data before test
 * seedPersistedData('myForm', { name: 'John', email: 'john@test.com' });
 *
 * // Now test that the form restores this data
 * const { result } = renderHook(() => useFormPersist('myForm', { name: '', email: '' }));
 * expect(result.current[0].name).toBe('John');
 * ```
 */
export function seedPersistedData<T>(
  key: string,
  data: T,
  options: {
    storage?: Storage;
    version?: number;
    timestamp?: number;
    expiresAt?: number;
  } = {}
): void {
  const {
    storage = localStorage,
    version = 1,
    timestamp = Date.now(),
    expiresAt,
  } = options;

  const fullKey = `${DEFAULT_KEY_PREFIX}${key}`;
  const wrapped = {
    data,
    timestamp,
    version,
    ...(expiresAt && { expiresAt }),
  };

  storage.setItem(fullKey, JSON.stringify(wrapped));
}

/**
 * Get persisted data from storage for assertions
 *
 * @param key - Form key (without prefix)
 * @param storage - Storage to read from
 * @returns Parsed data or null
 *
 * @example
 * ```typescript
 * // After form updates
 * act(() => {
 *   result.current[1]({ name: 'Jane' });
 * });
 *
 * // Wait for debounce
 * await waitForPersist();
 *
 * // Assert
 * const persisted = getPersistedData('myForm');
 * expect(persisted.name).toBe('Jane');
 * ```
 */
export function getPersistedData<T>(
  key: string,
  storage: Storage = localStorage
): T | null {
  const fullKey = `${DEFAULT_KEY_PREFIX}${key}`;
  const raw = storage.getItem(fullKey);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed.data as T;
  } catch {
    return null;
  }
}

/**
 * Clear all test data from storage
 *
 * @param storage - Storage to clear
 */
export function clearTestStorage(storage: Storage = localStorage): void {
  const keysToRemove: string[] = [];

  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && key.startsWith(DEFAULT_KEY_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => storage.removeItem(key));
}

/**
 * Wait for debounced persist to complete
 *
 * @param ms - Milliseconds to wait (default 600ms to exceed default 500ms debounce)
 * @returns Promise that resolves after delay
 *
 * @example
 * ```typescript
 * act(() => {
 *   result.current[1]({ name: 'Test' });
 * });
 *
 * await waitForPersist();
 *
 * expect(getPersistedData('myForm')).toEqual({ name: 'Test' });
 * ```
 */
export function waitForPersist(ms: number = 600): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a test wrapper with FormPersistProvider
 *
 * @param defaults - Default options for provider
 * @returns Wrapper component for testing
 *
 * @example
 * ```typescript
 * const wrapper = createTestWrapper({ debounce: 0, debug: true });
 *
 * const { result } = renderHook(
 *   () => useFormPersist('test', { name: '' }),
 *   { wrapper }
 * );
 * ```
 */
/* istanbul ignore next -- @preserve Test utility wrapper */
export function createTestWrapper(
  defaults: Record<string, unknown> = {}
): React.FC<{ children: React.ReactNode }> {
  // We import dynamically to avoid circular dependencies
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { FormPersistProvider } = require('../components/FormPersistProvider');

  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      FormPersistProvider,
      { defaults },
      children
    );
  };
}

/**
 * Simulate storage quota exceeded error
 *
 * @param storage - Mock storage to configure
 */
export function simulateStorageFull(storage: StorageAdapter): void {
  const originalSetItem = storage.setItem;
  storage.setItem = () => {
    const error = new Error('QuotaExceededError');
    error.name = 'QuotaExceededError';
    throw error;
  };

  // Allow restoring original behavior
  (storage as unknown as { restoreSetItem: () => void }).restoreSetItem = () => {
    storage.setItem = originalSetItem;
  };
}

/**
 * Simulate corrupted storage data
 *
 * @param key - Form key
 * @param storage - Storage to corrupt
 */
export function simulateCorruptedData(
  key: string,
  storage: Storage = localStorage
): void {
  const fullKey = `${DEFAULT_KEY_PREFIX}${key}`;
  storage.setItem(fullKey, 'not-valid-json{{{');
}
