/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Tests for middleware/merge.ts
 */

import {
  shallowMerge,
  deepMerge,
  preferStoredMerge,
  preferInitialMerge,
  getMergeFunction,
  isEqual,
} from '../middleware/merge';

describe('merge', () => {
  describe('shallowMerge', () => {
    it('should merge stored over initial at first level', () => {
      const stored = { name: 'John' };
      const initial = { name: '', email: '' };

      const result = shallowMerge(stored, initial);

      expect(result).toEqual({ name: 'John', email: '' });
    });

    it('should replace nested objects entirely', () => {
      const stored = { address: { city: 'NYC' } };
      const initial = { address: { city: '', zip: '' } };

      const result = shallowMerge(stored, initial);

      // zip is lost because the entire address object is replaced
      expect(result).toEqual({ address: { city: 'NYC' } });
    });

    it('should handle non-object initial state', () => {
      const stored = 'stored value';
      const initial = 'initial value';

      const result = shallowMerge(stored as any, initial as any);

      expect(result).toBe('stored value');
    });

    it('should use initial when stored is undefined', () => {
      const stored = undefined;
      const initial = { name: 'default' };

      const result = shallowMerge(stored as any, initial);

      expect(result).toEqual({ name: 'default' });
    });
  });

  describe('deepMerge', () => {
    it('should recursively merge nested objects', () => {
      const stored = { address: { city: 'NYC' } };
      const initial = { address: { city: '', zip: '' } };

      const result = deepMerge(stored, initial);

      expect(result).toEqual({ address: { city: 'NYC', zip: '' } });
    });

    it('should handle deeply nested objects', () => {
      const stored = { level1: { level2: { value: 'stored' } } };
      const initial = { level1: { level2: { value: '', other: 'initial' } } };

      const result = deepMerge(stored, initial);

      expect(result).toEqual({
        level1: { level2: { value: 'stored', other: 'initial' } },
      });
    });

    it('should handle arrays in stored data', () => {
      const stored = { items: [1, 2, 3] };
      const initial = { items: [] };

      const result = deepMerge(stored, initial);

      expect(result).toEqual({ items: [1, 2, 3] });
    });

    it('should handle non-object values', () => {
      const stored = 'string';
      const initial = { obj: true };

      const result = deepMerge(stored as any, initial);

      expect(result).toBe('string');
    });

    it('should use initial when stored is not plain object', () => {
      const stored = null;
      const initial = { name: 'default' };

      const result = deepMerge(stored as any, initial);

      expect(result).toEqual({ name: 'default' });
    });

    it('should prevent prototype pollution attacks', () => {
      const maliciousStored = JSON.parse('{"__proto__": {"polluted": true}, "name": "safe"}');
      const initial = { name: '', email: '' };

      const result = deepMerge(maliciousStored, initial);

      // Should not pollute Object prototype
      expect(({} as any).polluted).toBeUndefined();
      // Should still merge safe keys
      expect(result.name).toBe('safe');
    });

    it('should skip constructor key to prevent pollution', () => {
      const maliciousStored = { constructor: { polluted: true }, name: 'safe' };
      const initial = { name: '', email: '' };

      const result = deepMerge(maliciousStored as any, initial);

      expect(result.name).toBe('safe');
      // Constructor should remain the default Object constructor, not overwritten
      expect(result.constructor).toBe(Object);
    });
  });

  describe('preferStoredMerge', () => {
    it('should prefer stored values when available', () => {
      const stored = { name: 'John' };
      const initial = { name: '', email: 'default@test.com' };

      const result = preferStoredMerge(stored, initial);

      expect(result).toEqual({ name: 'John', email: 'default@test.com' });
    });

    it('should use initial for missing stored keys', () => {
      const stored = { name: 'John' };
      const initial = { name: '', email: '', phone: '' };

      const result = preferStoredMerge(stored, initial);

      expect(result).toEqual({ name: 'John', email: '', phone: '' });
    });

    it('should handle extra stored keys', () => {
      const stored = { name: 'John', extra: 'value' };
      const initial = { name: '' };

      const result = preferStoredMerge(stored, initial);

      expect(result).toEqual({ name: 'John', extra: 'value' });
    });
  });

  describe('preferInitialMerge', () => {
    it('should prefer initial values when not empty', () => {
      const stored = { name: 'John' };
      const initial = { name: 'Jane', email: '' };

      const result = preferInitialMerge(stored, initial);

      expect(result).toEqual({ name: 'Jane', email: '' });
    });

    it('should use stored for empty initial values', () => {
      const stored = { name: 'John', email: 'john@test.com' };
      const initial = { name: '', email: '' };

      const result = preferInitialMerge(stored, initial);

      expect(result).toEqual({ name: 'John', email: 'john@test.com' });
    });

    it('should handle null initial values', () => {
      const stored = { value: 'stored' };
      const initial = { value: null };

      const result = preferInitialMerge(stored, initial as any);

      expect(result).toEqual({ value: 'stored' });
    });

    it('should handle empty array initial values', () => {
      const stored = { items: [1, 2, 3] };
      const initial = { items: [] };

      const result = preferInitialMerge(stored, initial);

      expect(result).toEqual({ items: [1, 2, 3] });
    });

    it('should handle empty object initial values', () => {
      const stored = { nested: { value: 'stored' } };
      const initial = { nested: {} };

      const result = preferInitialMerge(stored, initial);

      expect(result).toEqual({ nested: { value: 'stored' } });
    });

    it('should handle non-object initial', () => {
      const stored = { name: 'John' };
      const initial = 'not an object';

      const result = preferInitialMerge(stored, initial as any);

      expect(result).toBe('not an object');
    });
  });

  describe('getMergeFunction', () => {
    it('should return shallowMerge for shallow strategy', () => {
      const fn = getMergeFunction('shallow');
      const result = fn({ a: 1 }, { a: 0, b: 0 });
      expect(result).toEqual({ a: 1, b: 0 });
    });

    it('should return deepMerge for deep strategy', () => {
      const fn = getMergeFunction('deep');
      const result = fn(
        { nested: { a: 1 } },
        { nested: { a: 0, b: 0 } }
      );
      expect(result).toEqual({ nested: { a: 1, b: 0 } });
    });

    it('should return preferStoredMerge for prefer-stored strategy', () => {
      const fn = getMergeFunction('prefer-stored');
      expect(fn).toBe(preferStoredMerge);
    });

    it('should return preferInitialMerge for prefer-initial strategy', () => {
      const fn = getMergeFunction('prefer-initial');
      expect(fn).toBe(preferInitialMerge);
    });

    it('should return custom function when provided', () => {
      const customFn = jest.fn((stored, initial) => ({ ...initial, ...stored }));
      const fn = getMergeFunction(customFn);

      expect(fn).toBe(customFn);
    });

    it('should default to shallowMerge', () => {
      const fn = getMergeFunction();
      const result = fn({ a: 1 }, { a: 0, b: 0 });
      expect(result).toEqual({ a: 1, b: 0 });
    });

    it('should default to shallowMerge for unknown strategy', () => {
      const fn = getMergeFunction('unknown' as any);
      const result = fn({ a: 1 }, { a: 0, b: 0 });
      expect(result).toEqual({ a: 1, b: 0 });
    });
  });

  describe('isEqual', () => {
    it('should return true for identical primitives', () => {
      expect(isEqual(1, 1)).toBe(true);
      expect(isEqual('test', 'test')).toBe(true);
      expect(isEqual(true, true)).toBe(true);
      expect(isEqual(null, null)).toBe(true);
    });

    it('should return false for different primitives', () => {
      expect(isEqual(1, 2)).toBe(false);
      expect(isEqual('a', 'b')).toBe(false);
      expect(isEqual(true, false)).toBe(false);
    });

    it('should return false for different types', () => {
      expect(isEqual(1, '1')).toBe(false);
      expect(isEqual(null, undefined)).toBe(false);
    });

    it('should compare arrays deeply', () => {
      expect(isEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(isEqual([1, 2], [1, 2, 3])).toBe(false);
      expect(isEqual([1, [2, 3]], [1, [2, 3]])).toBe(true);
      expect(isEqual([1, [2, 3]], [1, [2, 4]])).toBe(false);
    });

    it('should compare objects deeply', () => {
      expect(isEqual({ a: 1 }, { a: 1 })).toBe(true);
      expect(isEqual({ a: 1 }, { a: 2 })).toBe(false);
      expect(isEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
      expect(isEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
      expect(isEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
    });

    it('should handle nested arrays and objects', () => {
      const obj1 = { arr: [1, { nested: true }] };
      const obj2 = { arr: [1, { nested: true }] };
      const obj3 = { arr: [1, { nested: false }] };

      expect(isEqual(obj1, obj2)).toBe(true);
      expect(isEqual(obj1, obj3)).toBe(false);
    });

    it('should return true for same reference', () => {
      const obj = { a: 1 };
      expect(isEqual(obj, obj)).toBe(true);
    });
  });
});
