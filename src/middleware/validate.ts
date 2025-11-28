/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @license MIT
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Validation utilities for data integrity
 */

import type { PersistedData, MigrateFn, PersistError, PersistErrorInfo } from '../core/types';

/**
 * Validate the structure of persisted data wrapper
 *
 * @param data - Data to validate
 * @returns boolean indicating if structure is valid
 */
export function isValidPersistedData<T>(data: unknown): data is PersistedData<T> {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const persisted = data as Partial<PersistedData<T>>;

  return (
    'data' in persisted &&
    'timestamp' in persisted &&
    typeof persisted.timestamp === 'number' &&
    'version' in persisted &&
    typeof persisted.version === 'number'
  );
}

/**
 * Check if persisted data has expired
 *
 * @param data - Persisted data to check
 * @returns boolean indicating if data has expired
 */
export function isExpired<T>(data: PersistedData<T>): boolean {
  if (data.expiresAt === undefined) {
    return false;
  }
  return Date.now() > data.expiresAt;
}

/**
 * Check if data needs migration based on version
 *
 * @param storedVersion - Version of stored data
 * @param currentVersion - Current schema version
 * @returns boolean indicating if migration is needed
 */
export function needsMigration(storedVersion: number, currentVersion: number): boolean {
  return storedVersion < currentVersion;
}

/**
 * Migrate data from an older version to the current version
 *
 * @param data - Stored data
 * @param storedVersion - Version of stored data
 * @param currentVersion - Current schema version
 * @param migrateFn - Migration function
 * @returns Migrated data or null if migration fails
 */
export function migrateData<T>(
  data: unknown,
  storedVersion: number,
  currentVersion: number,
  migrateFn?: MigrateFn<T>
): T | null {
  if (!needsMigration(storedVersion, currentVersion)) {
    return data as T;
  }

  if (!migrateFn) {
    // No migration function provided, return data as-is
    // This may cause issues if schema has changed significantly
    return data as T;
  }

  try {
    return migrateFn(data, storedVersion);
  } catch {
    return null;
  }
}

/**
 * Create an error info object
 *
 * @param type - Error type
 * @param key - Storage key
 * @param message - Error message
 * @param error - Original error (optional)
 * @returns PersistErrorInfo object
 */
export function createErrorInfo(
  type: PersistError,
  key: string,
  message: string,
  error?: Error
): PersistErrorInfo {
  return {
    type,
    key,
    message,
    error,
  };
}

/**
 * Detect the type of storage error
 *
 * @param error - The error to analyze
 * @returns The detected error type
 */
export function detectErrorType(error: unknown): PersistError {
  if (!(error instanceof Error)) {
    return 'UNKNOWN';
  }

  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // Quota exceeded errors
  if (
    name === 'quotaexceedederror' ||
    message.includes('quota') ||
    message.includes('storage full') ||
    message.includes('exceeded the quota')
  ) {
    return 'QUOTA_EXCEEDED';
  }

  // Parse errors
  if (
    name === 'syntaxerror' ||
    message.includes('json') ||
    message.includes('parse') ||
    message.includes('unexpected token')
  ) {
    return 'PARSE_ERROR';
  }

  return 'UNKNOWN';
}

/**
 * Safely parse JSON with error type detection
 *
 * @param json - JSON string to parse
 * @returns Parsed object or error info
 */
export function safeJsonParse<T>(
  json: string
): { success: true; data: T } | { success: false; error: PersistError } {
  try {
    const data = JSON.parse(json) as T;
    return { success: true, data };
  } catch (e) {
    return {
      success: false,
      error: detectErrorType(e),
    };
  }
}

/**
 * Validate data using a custom validation function
 *
 * @param data - Data to validate
 * @param validateFn - Validation function
 * @returns boolean indicating if data is valid
 */
export function validateData<T>(
  data: T,
  validateFn?: (data: T) => boolean
): boolean {
  if (!validateFn) {
    return true;
  }

  try {
    return validateFn(data);
  } catch {
    return false;
  }
}
