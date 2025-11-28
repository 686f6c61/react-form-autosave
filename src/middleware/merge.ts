/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @license MIT
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Merge strategies for combining stored data with initial state
 */

import type { MergeStrategy, MergeFn } from '../core/types';

/**
 * Check if a value is a plain object (not array, null, or other types)
 *
 * @param value - Value to check
 * @returns boolean indicating if value is a plain object
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

/**
 * Shallow merge: only first-level properties from stored override initial
 *
 * @param stored - Data from storage
 * @param initial - Initial state
 * @returns Merged state
 *
 * @example
 * ```typescript
 * shallowMerge(
 *   { name: 'John', address: { city: 'NYC' } },
 *   { name: '', email: '', address: { city: '', zip: '' } }
 * );
 * // Result: { name: 'John', email: '', address: { city: 'NYC' } }
 * // Note: address.zip is lost because shallow merge replaced the whole object
 * ```
 */
export function shallowMerge<T>(stored: Partial<T>, initial: T): T {
  /* istanbul ignore if -- @preserve Non-object fallback */
  if (!isPlainObject(initial)) {
    return (stored as T) ?? initial;
  }

  return {
    ...initial,
    ...stored,
  };
}

/**
 * Deep merge: recursively merge nested objects
 *
 * @param stored - Data from storage
 * @param initial - Initial state
 * @returns Merged state
 *
 * @example
 * ```typescript
 * deepMerge(
 *   { name: 'John', address: { city: 'NYC' } },
 *   { name: '', email: '', address: { city: '', zip: '' } }
 * );
 * // Result: { name: 'John', email: '', address: { city: 'NYC', zip: '' } }
 * // Note: address.zip is preserved from initial
 * ```
 */
export function deepMerge<T>(stored: Partial<T>, initial: T): T {
  if (!isPlainObject(initial) || !isPlainObject(stored)) {
    return (stored as T) ?? initial;
  }

  const result: Record<string, unknown> = { ...initial };

  // Dangerous keys that could lead to prototype pollution
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];

  for (const key of Object.keys(stored)) {
    // Skip dangerous keys to prevent prototype pollution
    if (dangerousKeys.includes(key)) {
      continue;
    }

    const storedValue = stored[key as keyof typeof stored];
    const initialValue = initial[key as keyof typeof initial];

    if (isPlainObject(storedValue) && isPlainObject(initialValue)) {
      result[key] = deepMerge(storedValue, initialValue);
    } else if (storedValue !== undefined) {
      result[key] = storedValue;
    }
  }

  return result as T;
}

/**
 * Prefer stored: use stored data completely, only use initial for missing keys
 *
 * @param stored - Data from storage
 * @param initial - Initial state
 * @returns Stored state with initial as fallback for missing keys
 */
export function preferStoredMerge<T>(stored: Partial<T>, initial: T): T {
  /* istanbul ignore if -- @preserve Non-object fallback */
  if (!isPlainObject(initial)) {
    return (stored as T) ?? initial;
  }

  const result: Record<string, unknown> = {};
  const allKeys = new Set([
    ...Object.keys(initial as Record<string, unknown>),
    ...Object.keys(stored as Record<string, unknown>),
  ]);

  for (const key of allKeys) {
    const storedValue = stored[key as keyof typeof stored];
    const initialValue = initial[key as keyof typeof initial];

    if (storedValue !== undefined) {
      result[key] = storedValue;
    } else {
      result[key] = initialValue;
    }
  }

  return result as T;
}

/**
 * Prefer initial: use initial data, only fill in from stored if initial is empty/default
 *
 * @param stored - Data from storage
 * @param initial - Initial state
 * @returns Initial state with stored values only for empty fields
 */
export function preferInitialMerge<T>(stored: Partial<T>, initial: T): T {
  if (!isPlainObject(initial)) {
    return initial;
  }

  const result: Record<string, unknown> = { ...initial };

  for (const key of Object.keys(stored)) {
    const storedValue = stored[key as keyof typeof stored];
    const initialValue = initial[key as keyof typeof initial];

    // Only use stored if initial is empty/default
    if (isEmpty(initialValue) && storedValue !== undefined) {
      result[key] = storedValue;
    }
  }

  return result as T;
}

/**
 * Check if a value is considered "empty" (null, undefined, empty string, empty array)
 *
 * @param value - Value to check
 * @returns boolean indicating if value is empty
 */
function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (isPlainObject(value) && Object.keys(value).length === 0) return true;
  return false;
}

/**
 * Get the appropriate merge function based on strategy
 *
 * @param strategy - The merge strategy or custom merge function
 * @returns Merge function
 *
 * @example
 * ```typescript
 * const merge = getMergeFunction('deep');
 * const result = merge(storedData, initialState);
 *
 * // Or with custom function
 * const merge = getMergeFunction((stored, initial) => ({
 *   ...initial,
 *   ...stored,
 *   updatedAt: Date.now(),
 * }));
 * ```
 */
export function getMergeFunction<T>(
  strategy: MergeStrategy | MergeFn<T> = 'shallow'
): MergeFn<T> {
  if (typeof strategy === 'function') {
    return strategy;
  }

  switch (strategy) {
    case 'deep':
      return deepMerge;
    case 'prefer-stored':
      return preferStoredMerge;
    case 'prefer-initial':
      return preferInitialMerge;
    case 'shallow':
    default:
      return shallowMerge;
  }
}

/**
 * Compare two values for equality (deep comparison)
 *
 * @param a - First value
 * @param b - Second value
 * @returns boolean indicating if values are equal
 */
export function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => isEqual(val, b[idx]));
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    return keysA.every((key) => isEqual(a[key], b[key]));
  }

  return false;
}
