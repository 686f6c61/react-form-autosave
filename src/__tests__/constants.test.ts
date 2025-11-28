/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Tests for core/constants.ts
 */

import {
  LIBRARY_NAME,
  VERSION,
  DEFAULT_KEY_PREFIX,
  DEFAULT_SYNC_CHANNEL,
  DEFAULT_DEBOUNCE,
  DEFAULT_VERSION,
  DEFAULT_MAX_HISTORY,
  DEFAULT_COMPRESSION_THRESHOLD,
  DEFAULT_PARTITION_SIZE,
  MAX_STORAGE_SIZE,
  DEFAULT_WARN_SIZE,
  DEFAULT_OPTIONS,
} from '../core/constants';

describe('constants', () => {
  describe('LIBRARY_NAME', () => {
    it('should be react-form-autosave', () => {
      expect(LIBRARY_NAME).toBe('react-form-autosave');
    });
  });

  describe('VERSION', () => {
    it('should be 0.1.2', () => {
      expect(VERSION).toBe('0.1.2');
    });
  });

  describe('DEFAULT_KEY_PREFIX', () => {
    it('should be rfp:', () => {
      expect(DEFAULT_KEY_PREFIX).toBe('rfp:');
    });
  });

  describe('DEFAULT_SYNC_CHANNEL', () => {
    it('should be react-form-autosave-sync', () => {
      expect(DEFAULT_SYNC_CHANNEL).toBe('react-form-autosave-sync');
    });
  });

  describe('DEFAULT_DEBOUNCE', () => {
    it('should be 500', () => {
      expect(DEFAULT_DEBOUNCE).toBe(500);
    });
  });

  describe('DEFAULT_VERSION', () => {
    it('should be 1', () => {
      expect(DEFAULT_VERSION).toBe(1);
    });
  });

  describe('DEFAULT_MAX_HISTORY', () => {
    it('should be 50', () => {
      expect(DEFAULT_MAX_HISTORY).toBe(50);
    });
  });

  describe('DEFAULT_COMPRESSION_THRESHOLD', () => {
    it('should be 1024', () => {
      expect(DEFAULT_COMPRESSION_THRESHOLD).toBe(1024);
    });
  });

  describe('DEFAULT_PARTITION_SIZE', () => {
    it('should be 4096', () => {
      expect(DEFAULT_PARTITION_SIZE).toBe(4096);
    });
  });

  describe('MAX_STORAGE_SIZE', () => {
    it('should be 5MB', () => {
      expect(MAX_STORAGE_SIZE).toBe(5 * 1024 * 1024);
    });
  });

  describe('DEFAULT_WARN_SIZE', () => {
    it('should be 4MB', () => {
      expect(DEFAULT_WARN_SIZE).toBe(4 * 1024 * 1024);
    });
  });

  describe('DEFAULT_OPTIONS', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_OPTIONS.storage).toBe('localStorage');
      expect(DEFAULT_OPTIONS.debounce).toBe(DEFAULT_DEBOUNCE);
      expect(DEFAULT_OPTIONS.enabled).toBe(true);
      expect(DEFAULT_OPTIONS.version).toBe(DEFAULT_VERSION);
      expect(DEFAULT_OPTIONS.merge).toBe('shallow');
      expect(DEFAULT_OPTIONS.debug).toBe(false);
      expect(DEFAULT_OPTIONS.persistMode).toBe('full');
      expect(DEFAULT_OPTIONS.exclude).toEqual([]);
    });
  });
});
