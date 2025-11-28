/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @license MIT
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Tests for middleware functions
 */

import {
  createDebouncedFn,
  createThrottledFn,
  shallowMerge,
  deepMerge,
  preferStoredMerge,
  preferInitialMerge,
  getMergeFunction,
  isEqual,
  wrapWithMetadata,
  unwrapData,
  filterExcludedFields,
  isValidPersistedData,
  isExpired,
} from '../middleware';

describe('Debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should debounce function calls', () => {
    const callback = jest.fn();
    const { debounced } = createDebouncedFn(callback, 100);

    debounced('a');
    debounced('b');
    debounced('c');

    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('c');
  });

  it('should allow canceling pending calls', () => {
    const callback = jest.fn();
    const { debounced, cancel } = createDebouncedFn(callback, 100);

    debounced('a');
    cancel();

    jest.advanceTimersByTime(100);

    expect(callback).not.toHaveBeenCalled();
  });

  it('should flush pending calls immediately', () => {
    const callback = jest.fn();
    const { debounced, flush } = createDebouncedFn(callback, 100);

    debounced('a');
    flush();

    expect(callback).toHaveBeenCalledWith('a');
  });
});

describe('Throttle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should throttle function calls', () => {
    const callback = jest.fn();
    const { throttled } = createThrottledFn(callback, 100);

    throttled('a');
    throttled('b');
    throttled('c');

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('a');

    jest.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(2);
  });
});

describe('Merge Strategies', () => {
  const initial = {
    name: 'Initial',
    nested: { a: 1, b: 2 },
    array: [1, 2],
  };

  describe('shallowMerge', () => {
    it('should merge first-level properties', () => {
      const stored = { name: 'Stored', extra: 'field' };
      const result = shallowMerge(stored, initial);

      expect(result.name).toBe('Stored');
      expect((result as typeof initial & { extra: string }).extra).toBe('field');
    });

    it('should replace nested objects entirely', () => {
      const stored = { nested: { a: 10 } };
      const result = shallowMerge(stored, initial);

      expect(result.nested).toEqual({ a: 10 });
    });
  });

  describe('deepMerge', () => {
    it('should merge nested objects recursively', () => {
      const stored = { nested: { a: 10 } };
      const result = deepMerge(stored, initial);

      expect(result.nested).toEqual({ a: 10, b: 2 });
    });
  });

  describe('preferStoredMerge', () => {
    it('should prefer stored values', () => {
      const stored = { name: 'Stored' };
      const result = preferStoredMerge(stored, initial);

      expect(result.name).toBe('Stored');
      expect(result.nested).toEqual(initial.nested);
    });
  });

  describe('preferInitialMerge', () => {
    it('should prefer initial values unless empty', () => {
      const stored = { name: 'Stored' };
      const initialWithEmpty = { name: '', nested: { a: 1 }, array: [] };
      const result = preferInitialMerge(stored, initialWithEmpty);

      expect(result.name).toBe('Stored'); // Initial was empty
    });
  });

  describe('getMergeFunction', () => {
    it('should return correct merge function for strategy', () => {
      expect(getMergeFunction('shallow')).toBe(shallowMerge);
      expect(getMergeFunction('deep')).toBe(deepMerge);
    });

    it('should return custom function when provided', () => {
      const customMerge = () => ({ custom: true });
      expect(getMergeFunction(customMerge)).toBe(customMerge);
    });
  });
});

describe('isEqual', () => {
  it('should compare primitives', () => {
    expect(isEqual(1, 1)).toBe(true);
    expect(isEqual('a', 'a')).toBe(true);
    expect(isEqual(1, 2)).toBe(false);
  });

  it('should compare arrays', () => {
    expect(isEqual([1, 2], [1, 2])).toBe(true);
    expect(isEqual([1, 2], [2, 1])).toBe(false);
  });

  it('should compare objects', () => {
    expect(isEqual({ a: 1 }, { a: 1 })).toBe(true);
    expect(isEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it('should compare nested structures', () => {
    expect(isEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
    expect(isEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
  });
});

describe('Transform', () => {
  describe('wrapWithMetadata', () => {
    it('should wrap data with timestamp and version', () => {
      const data = { name: 'Test' };
      const wrapped = wrapWithMetadata(data, 1);

      expect(wrapped.data).toEqual(data);
      expect(wrapped.version).toBe(1);
      expect(wrapped.timestamp).toBeDefined();
    });

    it('should add expiration when specified', () => {
      const data = { name: 'Test' };
      const wrapped = wrapWithMetadata(data, 1, 60); // 60 minutes

      expect(wrapped.expiresAt).toBeDefined();
      expect(wrapped.expiresAt).toBeGreaterThan(Date.now());
    });
  });

  describe('unwrapData', () => {
    it('should extract data from wrapped object', () => {
      const wrapped = wrapWithMetadata({ name: 'Test' }, 1);
      const data = unwrapData(wrapped);

      expect(data).toEqual({ name: 'Test' });
    });

    it('should return null for expired data', () => {
      const wrapped = {
        data: { name: 'Test' },
        timestamp: Date.now() - 60000,
        version: 1,
        expiresAt: Date.now() - 1000, // Already expired
      };

      expect(unwrapData(wrapped)).toBeNull();
    });
  });

  describe('filterExcludedFields', () => {
    it('should remove excluded fields', () => {
      const data = { name: 'Test', password: 'secret', email: 'test@test.com' };
      const filtered = filterExcludedFields(data, ['password']);

      expect(filtered.name).toBe('Test');
      expect(filtered.email).toBe('test@test.com');
      expect(filtered.password).toBeUndefined();
    });

    it('should return original data if no exclusions', () => {
      const data = { name: 'Test' };
      const filtered = filterExcludedFields(data, []);

      expect(filtered).toEqual(data);
    });
  });
});

describe('Validation', () => {
  describe('isValidPersistedData', () => {
    it('should validate correct structure', () => {
      const valid = {
        data: { name: 'Test' },
        timestamp: Date.now(),
        version: 1,
      };

      expect(isValidPersistedData(valid)).toBe(true);
    });

    it('should reject invalid structures', () => {
      expect(isValidPersistedData(null)).toBe(false);
      expect(isValidPersistedData({})).toBe(false);
      expect(isValidPersistedData({ data: {} })).toBe(false);
    });
  });

  describe('isExpired', () => {
    it('should return false when no expiration set', () => {
      const data = {
        data: {},
        timestamp: Date.now(),
        version: 1,
      };

      expect(isExpired(data)).toBe(false);
    });

    it('should return true when expired', () => {
      const data = {
        data: {},
        timestamp: Date.now() - 60000,
        version: 1,
        expiresAt: Date.now() - 1000,
      };

      expect(isExpired(data)).toBe(true);
    });

    it('should return false when not expired', () => {
      const data = {
        data: {},
        timestamp: Date.now(),
        version: 1,
        expiresAt: Date.now() + 60000,
      };

      expect(isExpired(data)).toBe(false);
    });
  });
});
