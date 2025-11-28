/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Tests for testing/testUtils.ts
 */

import {
  createMockStorage,
  seedPersistedData,
  getPersistedData,
  clearTestStorage,
  waitForPersist,
  createTestWrapper,
  simulateStorageFull,
  simulateCorruptedData,
} from '../testing/testUtils';
import { DEFAULT_KEY_PREFIX } from '../core/constants';

describe('testUtils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('createMockStorage', () => {
    it('should create a mock storage with all methods', () => {
      const storage = createMockStorage();

      expect(storage.getItem).toBeDefined();
      expect(storage.setItem).toBeDefined();
      expect(storage.removeItem).toBeDefined();
      expect(storage.clear).toBeDefined();
      expect(storage.store).toBeInstanceOf(Map);
    });

    it('should store and retrieve items', () => {
      const storage = createMockStorage();

      storage.setItem('key', 'value');
      expect(storage.getItem('key')).toBe('value');
    });

    it('should return null for missing items', () => {
      const storage = createMockStorage();

      expect(storage.getItem('nonexistent')).toBeNull();
    });

    it('should remove items', () => {
      const storage = createMockStorage();

      storage.setItem('key', 'value');
      storage.removeItem('key');

      expect(storage.getItem('key')).toBeNull();
    });

    it('should clear all items', () => {
      const storage = createMockStorage();

      storage.setItem('key1', 'value1');
      storage.setItem('key2', 'value2');
      storage.clear();

      expect(storage.getItem('key1')).toBeNull();
      expect(storage.getItem('key2')).toBeNull();
    });

    it('should track method calls', () => {
      const storage = createMockStorage();

      storage.setItem('key', 'value');
      storage.getItem('key');
      storage.removeItem('key');

      expect(storage.setItem).toHaveBeenCalledWith('key', 'value');
      expect(storage.getItem).toHaveBeenCalledWith('key');
      expect(storage.removeItem).toHaveBeenCalledWith('key');
    });
  });

  describe('seedPersistedData', () => {
    it('should seed data with default options', () => {
      seedPersistedData('testForm', { name: 'John' });

      const raw = localStorage.getItem(`${DEFAULT_KEY_PREFIX}testForm`);
      expect(raw).not.toBeNull();

      const parsed = JSON.parse(raw!);
      expect(parsed.data).toEqual({ name: 'John' });
      expect(parsed.version).toBe(1);
      expect(parsed.timestamp).toBeDefined();
    });

    it('should seed data with custom version', () => {
      seedPersistedData('testForm', { name: 'John' }, { version: 2 });

      const raw = localStorage.getItem(`${DEFAULT_KEY_PREFIX}testForm`);
      const parsed = JSON.parse(raw!);
      expect(parsed.version).toBe(2);
    });

    it('should seed data with custom timestamp', () => {
      const timestamp = Date.now() - 10000;
      seedPersistedData('testForm', { name: 'John' }, { timestamp });

      const raw = localStorage.getItem(`${DEFAULT_KEY_PREFIX}testForm`);
      const parsed = JSON.parse(raw!);
      expect(parsed.timestamp).toBe(timestamp);
    });

    it('should seed data with expiration', () => {
      const expiresAt = Date.now() + 60000;
      seedPersistedData('testForm', { name: 'John' }, { expiresAt });

      const raw = localStorage.getItem(`${DEFAULT_KEY_PREFIX}testForm`);
      const parsed = JSON.parse(raw!);
      expect(parsed.expiresAt).toBe(expiresAt);
    });

    it('should use custom storage', () => {
      seedPersistedData('testForm', { name: 'John' }, { storage: sessionStorage });

      const raw = sessionStorage.getItem(`${DEFAULT_KEY_PREFIX}testForm`);
      expect(raw).not.toBeNull();
    });
  });

  describe('getPersistedData', () => {
    it('should get persisted data', () => {
      seedPersistedData('testForm', { name: 'John' });

      const data = getPersistedData('testForm');
      expect(data).toEqual({ name: 'John' });
    });

    it('should return null for missing data', () => {
      const data = getPersistedData('nonexistent');
      expect(data).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      localStorage.setItem(`${DEFAULT_KEY_PREFIX}invalid`, 'not json');

      const data = getPersistedData('invalid');
      expect(data).toBeNull();
    });

    it('should use custom storage', () => {
      seedPersistedData('testForm', { name: 'John' }, { storage: sessionStorage });

      const data = getPersistedData('testForm', sessionStorage);
      expect(data).toEqual({ name: 'John' });
    });
  });

  describe('clearTestStorage', () => {
    it('should clear all prefixed items', () => {
      seedPersistedData('form1', { a: 1 });
      seedPersistedData('form2', { b: 2 });

      clearTestStorage();

      expect(getPersistedData('form1')).toBeNull();
      expect(getPersistedData('form2')).toBeNull();
    });

    it('should not clear non-prefixed items', () => {
      localStorage.setItem('other-key', 'value');
      seedPersistedData('form', { a: 1 });

      clearTestStorage();

      expect(localStorage.getItem('other-key')).toBe('value');
    });

    it('should use custom storage', () => {
      seedPersistedData('form', { a: 1 }, { storage: sessionStorage });

      clearTestStorage(sessionStorage);

      expect(getPersistedData('form', sessionStorage)).toBeNull();
    });
  });

  describe('waitForPersist', () => {
    it('should return a promise', () => {
      const result = waitForPersist();
      expect(result).toBeInstanceOf(Promise);
    });

    it('should resolve after default delay', async () => {
      const start = Date.now();
      await waitForPersist();
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(500);
    });

    it('should resolve after custom delay', async () => {
      const start = Date.now();
      await waitForPersist(100);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(90);
      expect(elapsed).toBeLessThan(500);
    });
  });

  describe('createTestWrapper', () => {
    it('should create a wrapper component', () => {
      const Wrapper = createTestWrapper();
      expect(Wrapper).toBeDefined();
    });

    it('should accept default options', () => {
      const Wrapper = createTestWrapper({ debounce: 0 });
      expect(Wrapper).toBeDefined();
    });
  });

  describe('simulateStorageFull', () => {
    it('should make setItem throw QuotaExceededError', () => {
      const storage = createMockStorage();

      simulateStorageFull(storage);

      expect(() => storage.setItem('key', 'value')).toThrow('QuotaExceededError');
    });

    it('should allow restoring original behavior', () => {
      const storage = createMockStorage();

      simulateStorageFull(storage);
      (storage as any).restoreSetItem();

      expect(() => storage.setItem('key', 'value')).not.toThrow();
    });
  });

  describe('simulateCorruptedData', () => {
    it('should store corrupted JSON', () => {
      simulateCorruptedData('testForm');

      const raw = localStorage.getItem(`${DEFAULT_KEY_PREFIX}testForm`);
      expect(raw).toBe('not-valid-json{{{');
    });

    it('should use custom storage', () => {
      simulateCorruptedData('testForm', sessionStorage);

      const raw = sessionStorage.getItem(`${DEFAULT_KEY_PREFIX}testForm`);
      expect(raw).toBe('not-valid-json{{{');
    });
  });
});
