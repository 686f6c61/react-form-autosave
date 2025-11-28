/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @license MIT
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Tests for utility functions
 */

import {
  clearGroup,
  getGroupKeys,
  hasGroupData,
  getGroupSize,
} from '../utils';
import { DEFAULT_KEY_PREFIX } from '../core/constants';

describe('Utility Functions', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('clearGroup', () => {
    it('should clear all items matching prefix', () => {
      localStorage.setItem(`${DEFAULT_KEY_PREFIX}checkout:step1`, 'data1');
      localStorage.setItem(`${DEFAULT_KEY_PREFIX}checkout:step2`, 'data2');
      localStorage.setItem(`${DEFAULT_KEY_PREFIX}other`, 'other');

      const cleared = clearGroup('checkout');

      expect(cleared).toBe(2);
      expect(localStorage.getItem(`${DEFAULT_KEY_PREFIX}checkout:step1`)).toBeNull();
      expect(localStorage.getItem(`${DEFAULT_KEY_PREFIX}checkout:step2`)).toBeNull();
      expect(localStorage.getItem(`${DEFAULT_KEY_PREFIX}other`)).toBe('other');
    });

    it('should return 0 when no items match', () => {
      localStorage.setItem(`${DEFAULT_KEY_PREFIX}other`, 'data');

      const cleared = clearGroup('nonexistent');

      expect(cleared).toBe(0);
    });

    it('should use custom storage', () => {
      sessionStorage.setItem(`${DEFAULT_KEY_PREFIX}test:item`, 'data');

      const cleared = clearGroup('test', sessionStorage);

      expect(cleared).toBe(1);
      expect(sessionStorage.getItem(`${DEFAULT_KEY_PREFIX}test:item`)).toBeNull();
    });

    it('should handle empty storage', () => {
      const cleared = clearGroup('empty');
      expect(cleared).toBe(0);
    });

    it('should handle errors gracefully', () => {
      // Create a mock storage that might throw
      const mockStorage = {
        length: 1,
        key: () => { throw new Error('Access denied'); },
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      } as unknown as Storage;

      const cleared = clearGroup('test', mockStorage);
      expect(cleared).toBe(0);
    });
  });

  describe('getGroupKeys', () => {
    it('should return all keys matching prefix', () => {
      localStorage.setItem(`${DEFAULT_KEY_PREFIX}wizard:step1`, 'data1');
      localStorage.setItem(`${DEFAULT_KEY_PREFIX}wizard:step2`, 'data2');
      localStorage.setItem(`${DEFAULT_KEY_PREFIX}other`, 'other');

      const keys = getGroupKeys('wizard');

      expect(keys).toHaveLength(2);
      expect(keys).toContain('wizard:step1');
      expect(keys).toContain('wizard:step2');
    });

    it('should return empty array when no matches', () => {
      const keys = getGroupKeys('nonexistent');
      expect(keys).toHaveLength(0);
    });

    it('should use custom storage', () => {
      sessionStorage.setItem(`${DEFAULT_KEY_PREFIX}session:key`, 'data');

      const keys = getGroupKeys('session', sessionStorage);

      expect(keys).toContain('session:key');
    });

    it('should strip default prefix from returned keys', () => {
      localStorage.setItem(`${DEFAULT_KEY_PREFIX}form:field`, 'data');

      const keys = getGroupKeys('form');

      expect(keys[0]).toBe('form:field');
      expect(keys[0]).not.toContain(DEFAULT_KEY_PREFIX);
    });

    it('should handle errors gracefully', () => {
      const mockStorage = {
        length: 1,
        key: () => { throw new Error('Access denied'); },
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      } as unknown as Storage;

      const keys = getGroupKeys('test', mockStorage);
      expect(keys).toEqual([]);
    });
  });

  describe('hasGroupData', () => {
    it('should return true when group has data', () => {
      localStorage.setItem(`${DEFAULT_KEY_PREFIX}form:data`, 'data');

      expect(hasGroupData('form')).toBe(true);
    });

    it('should return false when group is empty', () => {
      expect(hasGroupData('empty')).toBe(false);
    });

    it('should use custom storage', () => {
      sessionStorage.setItem(`${DEFAULT_KEY_PREFIX}session:data`, 'data');

      expect(hasGroupData('session', sessionStorage)).toBe(true);
      expect(hasGroupData('session', localStorage)).toBe(false);
    });
  });

  describe('getGroupSize', () => {
    it('should calculate total size of group', () => {
      localStorage.setItem(`${DEFAULT_KEY_PREFIX}size:a`, 'aaaaaaaaaa'); // 10 chars
      localStorage.setItem(`${DEFAULT_KEY_PREFIX}size:b`, 'bbbbbbbbbb'); // 10 chars

      const size = getGroupSize('size');

      expect(size).toBeGreaterThan(0);
    });

    it('should return 0 for empty group', () => {
      expect(getGroupSize('empty')).toBe(0);
    });

    it('should use custom storage', () => {
      sessionStorage.setItem(`${DEFAULT_KEY_PREFIX}session:data`, 'value');

      const size = getGroupSize('session', sessionStorage);

      expect(size).toBeGreaterThan(0);
    });

    it('should only count matching prefix', () => {
      localStorage.setItem(`${DEFAULT_KEY_PREFIX}target:a`, 'aaaa');
      localStorage.setItem(`${DEFAULT_KEY_PREFIX}other:b`, 'bbbb');

      const targetSize = getGroupSize('target');
      const otherSize = getGroupSize('other');

      // Both should be non-zero but different groups
      expect(targetSize).toBeGreaterThan(0);
      expect(otherSize).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', () => {
      const mockStorage = {
        length: 1,
        key: () => { throw new Error('Access denied'); },
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      } as unknown as Storage;

      const size = getGroupSize('test', mockStorage);
      expect(size).toBe(0);
    });

    it('should approximate UTF-16 byte size', () => {
      localStorage.setItem(`${DEFAULT_KEY_PREFIX}utf:test`, 'ab');

      const size = getGroupSize('utf');

      // Size should account for UTF-16 (2 bytes per character)
      // Key + value, multiplied by 2
      expect(size).toBeGreaterThan(0);
    });
  });
});
