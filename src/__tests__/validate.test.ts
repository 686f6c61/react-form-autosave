/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Tests for middleware/validate.ts
 */

import {
  isValidPersistedData,
  isExpired,
  needsMigration,
  migrateData,
  createErrorInfo,
  detectErrorType,
  safeJsonParse,
  validateData,
} from '../middleware/validate';

describe('validate', () => {
  describe('isValidPersistedData', () => {
    it('should return true for valid persisted data', () => {
      const valid = {
        data: { name: 'John' },
        timestamp: Date.now(),
        version: 1,
      };

      expect(isValidPersistedData(valid)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isValidPersistedData(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isValidPersistedData(undefined)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(isValidPersistedData('string')).toBe(false);
      expect(isValidPersistedData(123)).toBe(false);
    });

    it('should return false for missing data field', () => {
      const invalid = { timestamp: Date.now(), version: 1 };
      expect(isValidPersistedData(invalid)).toBe(false);
    });

    it('should return false for missing timestamp', () => {
      const invalid = { data: {}, version: 1 };
      expect(isValidPersistedData(invalid)).toBe(false);
    });

    it('should return false for missing version', () => {
      const invalid = { data: {}, timestamp: Date.now() };
      expect(isValidPersistedData(invalid)).toBe(false);
    });

    it('should return false for non-number timestamp', () => {
      const invalid = { data: {}, timestamp: 'now', version: 1 };
      expect(isValidPersistedData(invalid)).toBe(false);
    });

    it('should return false for non-number version', () => {
      const invalid = { data: {}, timestamp: Date.now(), version: '1' };
      expect(isValidPersistedData(invalid)).toBe(false);
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

    it('should return false when not expired', () => {
      const data = {
        data: {},
        timestamp: Date.now(),
        version: 1,
        expiresAt: Date.now() + 60000,
      };

      expect(isExpired(data)).toBe(false);
    });

    it('should return true when expired', () => {
      const data = {
        data: {},
        timestamp: Date.now() - 10000,
        version: 1,
        expiresAt: Date.now() - 5000,
      };

      expect(isExpired(data)).toBe(true);
    });
  });

  describe('needsMigration', () => {
    it('should return true when stored version is older', () => {
      expect(needsMigration(1, 2)).toBe(true);
    });

    it('should return false when versions match', () => {
      expect(needsMigration(2, 2)).toBe(false);
    });

    it('should return false when stored version is newer', () => {
      expect(needsMigration(3, 2)).toBe(false);
    });
  });

  describe('migrateData', () => {
    it('should return data as-is when no migration needed', () => {
      const data = { name: 'John' };
      const result = migrateData(data, 2, 2);

      expect(result).toEqual(data);
    });

    it('should return data as-is when no migrate function provided', () => {
      const data = { name: 'John' };
      const result = migrateData(data, 1, 2);

      expect(result).toEqual(data);
    });

    it('should call migrate function when migration needed', () => {
      const data = { firstName: 'John', lastName: 'Doe' };
      const migrate = jest.fn((oldData: any, _oldVersion: number) => ({
        fullName: `${oldData.firstName} ${oldData.lastName}`,
      }));

      const result = migrateData(data, 1, 2, migrate);

      expect(migrate).toHaveBeenCalledWith(data, 1);
      expect(result).toEqual({ fullName: 'John Doe' });
    });

    it('should return null when migration fails', () => {
      const data = { name: 'John' };
      const migrate = jest.fn(() => {
        throw new Error('Migration failed');
      });

      const result = migrateData(data, 1, 2, migrate);

      expect(result).toBeNull();
    });
  });

  describe('createErrorInfo', () => {
    it('should create error info object', () => {
      const errorInfo = createErrorInfo('QUOTA_EXCEEDED', 'test-key', 'Storage full');

      expect(errorInfo).toEqual({
        type: 'QUOTA_EXCEEDED',
        key: 'test-key',
        message: 'Storage full',
        error: undefined,
      });
    });

    it('should include original error when provided', () => {
      const originalError = new Error('Original');
      const errorInfo = createErrorInfo(
        'PARSE_ERROR',
        'test-key',
        'Parse failed',
        originalError
      );

      expect(errorInfo.error).toBe(originalError);
    });
  });

  describe('detectErrorType', () => {
    it('should detect quota exceeded error by name', () => {
      const error = new Error('Storage limit reached');
      error.name = 'QuotaExceededError';

      expect(detectErrorType(error)).toBe('QUOTA_EXCEEDED');
    });

    it('should detect quota exceeded error by message', () => {
      const error = new Error('Quota exceeded');
      expect(detectErrorType(error)).toBe('QUOTA_EXCEEDED');
    });

    it('should detect storage full by message', () => {
      const error = new Error('Storage full');
      expect(detectErrorType(error)).toBe('QUOTA_EXCEEDED');
    });

    it('should detect exceeded the quota by message', () => {
      const error = new Error('exceeded the quota');
      expect(detectErrorType(error)).toBe('QUOTA_EXCEEDED');
    });

    it('should detect parse error by name', () => {
      const error = new SyntaxError('Unexpected token');
      expect(detectErrorType(error)).toBe('PARSE_ERROR');
    });

    it('should detect parse error by json in message', () => {
      const error = new Error('JSON error occurred');
      expect(detectErrorType(error)).toBe('PARSE_ERROR');
    });

    it('should detect parse error by parse in message', () => {
      const error = new Error('Failed to parse data');
      expect(detectErrorType(error)).toBe('PARSE_ERROR');
    });

    it('should detect parse error by unexpected token', () => {
      const error = new Error('Unexpected token in input');
      expect(detectErrorType(error)).toBe('PARSE_ERROR');
    });

    it('should return UNKNOWN for other errors', () => {
      const error = new Error('Something else');
      expect(detectErrorType(error)).toBe('UNKNOWN');
    });

    it('should return UNKNOWN for non-Error objects', () => {
      expect(detectErrorType('string')).toBe('UNKNOWN');
      expect(detectErrorType(null)).toBe('UNKNOWN');
      expect(detectErrorType(undefined)).toBe('UNKNOWN');
    });
  });

  describe('safeJsonParse', () => {
    it('should return success with parsed data for valid JSON', () => {
      const result = safeJsonParse('{"name":"John"}');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: 'John' });
      }
    });

    it('should return failure with error type for invalid JSON', () => {
      const result = safeJsonParse('not valid json');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('PARSE_ERROR');
      }
    });

    it('should handle empty string', () => {
      const result = safeJsonParse('');

      expect(result.success).toBe(false);
    });
  });

  describe('validateData', () => {
    it('should return true when no validation function provided', () => {
      expect(validateData({ name: 'John' })).toBe(true);
    });

    it('should return true when validation passes', () => {
      const validate = (data: any) => data.name.length > 0;
      expect(validateData({ name: 'John' }, validate)).toBe(true);
    });

    it('should return false when validation fails', () => {
      const validate = (data: any) => data.name.length > 10;
      expect(validateData({ name: 'John' }, validate)).toBe(false);
    });

    it('should return false when validation throws', () => {
      const validate = () => {
        throw new Error('Validation error');
      };
      expect(validateData({ name: 'John' }, validate)).toBe(false);
    });
  });
});
