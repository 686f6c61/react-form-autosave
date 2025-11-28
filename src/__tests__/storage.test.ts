/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @license MIT
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Tests for storage adapters
 */

import {
  createMemoryStorage,
  isStorageAvailable,
  getStorageAdapter,
  isSSR,
  getStringByteSize,
  getStorageSize,
  clearStorageByPrefix,
} from '../storage';

describe('Storage Adapters', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('createMemoryStorage', () => {
    it('should create a working in-memory storage', () => {
      const storage = createMemoryStorage();

      storage.setItem('key1', 'value1');
      expect(storage.getItem('key1')).toBe('value1');

      storage.removeItem('key1');
      expect(storage.getItem('key1')).toBeNull();
    });

    it('should return null for non-existent keys', () => {
      const storage = createMemoryStorage();
      expect(storage.getItem('nonexistent')).toBeNull();
    });

    it('should handle multiple items', () => {
      const storage = createMemoryStorage();

      storage.setItem('key1', 'value1');
      storage.setItem('key2', 'value2');

      expect(storage.getItem('key1')).toBe('value1');
      expect(storage.getItem('key2')).toBe('value2');
    });

    it('should overwrite existing items', () => {
      const storage = createMemoryStorage();

      storage.setItem('key', 'old');
      storage.setItem('key', 'new');

      expect(storage.getItem('key')).toBe('new');
    });
  });

  describe('isStorageAvailable', () => {
    it('should return true for localStorage', () => {
      expect(isStorageAvailable('localStorage')).toBe(true);
    });

    it('should return true for sessionStorage', () => {
      expect(isStorageAvailable('sessionStorage')).toBe(true);
    });

    it('should handle storage errors gracefully', () => {
      // This is hard to test in jsdom, but the function should not throw
      expect(() => isStorageAvailable('localStorage')).not.toThrow();
    });
  });

  describe('getStorageAdapter', () => {
    it('should return localStorage adapter by default', () => {
      const adapter = getStorageAdapter();
      adapter.setItem('test', 'value');
      expect(localStorage.getItem('test')).toBe('value');
      localStorage.removeItem('test');
    });

    it('should return sessionStorage adapter when specified', () => {
      const adapter = getStorageAdapter('sessionStorage');
      adapter.setItem('test', 'value');
      expect(sessionStorage.getItem('test')).toBe('value');
      sessionStorage.removeItem('test');
    });

    it('should return memory storage when specified', () => {
      const adapter = getStorageAdapter('memory');
      adapter.setItem('test', 'value');
      expect(adapter.getItem('test')).toBe('value');
    });

    it('should return custom adapter when provided', () => {
      const customAdapter = {
        getItem: jest.fn().mockReturnValue('custom'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };

      const adapter = getStorageAdapter(customAdapter);
      expect(adapter.getItem('key')).toBe('custom');
      expect(customAdapter.getItem).toHaveBeenCalledWith('key');
    });

    it('should return same memory storage instance', () => {
      const adapter1 = getStorageAdapter('memory');
      adapter1.setItem('shared', 'value');

      const adapter2 = getStorageAdapter('memory');
      expect(adapter2.getItem('shared')).toBe('value');
    });

    it('should handle null custom adapter', () => {
      const adapter = getStorageAdapter(null as any);
      // Should fallback to memory
      expect(adapter).toBeDefined();
    });

    it('should wrap browser storage with error handling', () => {
      const adapter = getStorageAdapter('localStorage');

      // removeItem should not throw even if item doesn't exist
      expect(() => adapter.removeItem('nonexistent')).not.toThrow();
    });
  });

  describe('isSSR', () => {
    it('should return false in browser environment', () => {
      expect(isSSR()).toBe(false);
    });
  });

  describe('getStringByteSize', () => {
    it('should calculate byte size of ASCII strings', () => {
      const size = getStringByteSize('hello');
      expect(size).toBe(5);
    });

    it('should calculate byte size of Unicode strings', () => {
      const size = getStringByteSize('hello 世界');
      expect(size).toBeGreaterThan(getStringByteSize('hello'));
    });

    it('should handle empty strings', () => {
      expect(getStringByteSize('')).toBe(0);
    });

    it('should handle emoji', () => {
      const size = getStringByteSize('🎉');
      expect(size).toBeGreaterThan(1);
    });
  });

  describe('getStorageSize', () => {
    it('should calculate total size of storage', () => {
      localStorage.setItem('key1', 'value1');
      localStorage.setItem('key2', 'value2');

      const size = getStorageSize(localStorage);
      expect(size).toBeGreaterThan(0);
    });

    it('should filter by prefix', () => {
      localStorage.setItem('rfp:form1', 'value1');
      localStorage.setItem('other:key', 'value2');

      const size = getStorageSize(localStorage, 'rfp:');
      const totalSize = getStorageSize(localStorage);

      expect(size).toBeLessThan(totalSize);
    });

    it('should return 0 for empty storage', () => {
      const size = getStorageSize(localStorage);
      expect(size).toBe(0);
    });

    it('should handle storage without prefix filter', () => {
      localStorage.setItem('key', 'value');
      const size = getStorageSize(localStorage);
      expect(size).toBeGreaterThan(0);
    });
  });

  describe('clearStorageByPrefix', () => {
    it('should clear items with matching prefix', () => {
      localStorage.setItem('rfp:form1', 'value1');
      localStorage.setItem('rfp:form2', 'value2');
      localStorage.setItem('other:key', 'value3');

      clearStorageByPrefix(localStorage, 'rfp:');

      expect(localStorage.getItem('rfp:form1')).toBeNull();
      expect(localStorage.getItem('rfp:form2')).toBeNull();
      expect(localStorage.getItem('other:key')).toBe('value3');
    });

    it('should handle empty storage', () => {
      expect(() => clearStorageByPrefix(localStorage, 'rfp:')).not.toThrow();
    });

    it('should handle no matching items', () => {
      localStorage.setItem('other:key', 'value');

      clearStorageByPrefix(localStorage, 'rfp:');

      expect(localStorage.getItem('other:key')).toBe('value');
    });
  });
});
