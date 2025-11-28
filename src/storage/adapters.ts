/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @license MIT
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Storage adapters for different storage backends
 * Provides unified interface for localStorage, sessionStorage, and custom storage
 */

import type { StorageAdapter, StorageType } from '../core/types';

/**
 * In-memory storage adapter
 * Used as fallback when localStorage/sessionStorage is unavailable (e.g., incognito mode)
 *
 * @example
 * ```typescript
 * const memoryStorage = createMemoryStorage();
 * memoryStorage.setItem('key', 'value');
 * console.log(memoryStorage.getItem('key')); // 'value'
 * ```
 */
export function createMemoryStorage(): StorageAdapter {
  const store = new Map<string, string>();

  return {
    getItem(key: string): string | null {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
      store.set(key, value);
    },
    removeItem(key: string): void {
      store.delete(key);
    },
  };
}

/**
 * Check if storage is available and working
 * Handles various browser edge cases like Safari private browsing
 *
 * @param type - The storage type to check ('localStorage' or 'sessionStorage')
 * @returns boolean indicating if storage is available
 */
export function isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
  /* istanbul ignore if -- @preserve SSR check */
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const storage = window[type];
    const testKey = '__rfp_test__';

    /* istanbul ignore if -- @preserve Null storage check */
    if (!storage) {
      return false;
    }

    // Test actual read/write capability
    storage.setItem(testKey, testKey);
    const retrieved = storage.getItem(testKey);
    storage.removeItem(testKey);

    return retrieved === testKey;
  } catch {
    /* istanbul ignore next -- @preserve Storage errors */
    return false;
  }
}

/**
 * Create a storage adapter wrapping browser storage with error handling
 *
 * @param storage - The browser storage object (localStorage or sessionStorage)
 * @returns StorageAdapter wrapping the browser storage
 */
function createBrowserStorageAdapter(
  storage: Storage
): StorageAdapter {
  return {
    getItem(key: string): string | null {
      try {
        return storage.getItem(key);
      } catch {
        /* istanbul ignore next -- @preserve Storage read error */
        return null;
      }
    },
    setItem(key: string, value: string): void {
      storage.setItem(key, value);
    },
    removeItem(key: string): void {
      try {
        storage.removeItem(key);
      } catch /* istanbul ignore next -- @preserve Storage remove error */ {
        // Silently fail on remove errors
      }
    },
  };
}

/**
 * Singleton memory storage instance for fallback
 */
let memoryStorageInstance: StorageAdapter | null = null;

/**
 * Get memory storage singleton
 */
function getMemoryStorage(): StorageAdapter {
  if (!memoryStorageInstance) {
    memoryStorageInstance = createMemoryStorage();
  }
  return memoryStorageInstance;
}

/**
 * Get the appropriate storage adapter based on configuration
 * Falls back to memory storage if requested storage is unavailable
 *
 * @param storage - Storage type or custom adapter
 * @returns The resolved storage adapter
 *
 * @example
 * ```typescript
 * // Get localStorage adapter (with memory fallback)
 * const adapter = getStorageAdapter('localStorage');
 *
 * // Get sessionStorage adapter
 * const adapter = getStorageAdapter('sessionStorage');
 *
 * // Use custom adapter
 * const adapter = getStorageAdapter(myCustomAdapter);
 *
 * // Explicitly use memory storage
 * const adapter = getStorageAdapter('memory');
 * ```
 */
export function getStorageAdapter(
  storage: StorageType | StorageAdapter = 'localStorage'
): StorageAdapter {
  // If it's already a custom adapter, return it
  if (typeof storage === 'object' && storage !== null) {
    return storage;
  }

  // Handle memory storage request
  if (storage === 'memory') {
    return getMemoryStorage();
  }

  // Try to get browser storage, fallback to memory if unavailable
  if (storage === 'localStorage' && isStorageAvailable('localStorage')) {
    return createBrowserStorageAdapter(window.localStorage);
  }

  if (storage === 'sessionStorage' && isStorageAvailable('sessionStorage')) {
    return createBrowserStorageAdapter(window.sessionStorage);
  }

  // Fallback to memory storage
  return getMemoryStorage();
}

/**
 * Check if running in a server-side rendering context
 *
 * @returns boolean indicating if running on server
 */
export function isSSR(): boolean {
  return typeof window === 'undefined';
}

/**
 * Calculate the size in bytes of a string
 *
 * @param str - The string to measure
 * @returns Size in bytes
 */
export function getStringByteSize(str: string): number {
  // Use Blob if available for accurate UTF-8 byte count
  if (typeof Blob !== 'undefined') {
    return new Blob([str]).size;
  }
  /* istanbul ignore next -- @preserve SSR/Node fallback */
  return str.length * 2;
}

/**
 * Get total size used in storage for a specific key prefix
 *
 * @param storage - The storage to check
 * @param prefix - Key prefix to match
 * @returns Total size in bytes
 */
export function getStorageSize(
  storage: Storage,
  prefix?: string
): number {
  let total = 0;

  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && (!prefix || key.startsWith(prefix))) {
        const value = storage.getItem(key);
        if (value) {
          total += getStringByteSize(key) + getStringByteSize(value);
        }
      }
    }
  } catch {
    // Storage access error
  }

  return total;
}

/**
 * Clear all items in storage matching a prefix
 *
 * @param storage - The storage to clear
 * @param prefix - Key prefix to match
 */
export function clearStorageByPrefix(
  storage: Storage,
  prefix: string
): void {
  const keysToRemove: string[] = [];

  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      storage.removeItem(key);
    });
  } catch {
    // Storage access error
  }
}
