/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @license MIT
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Utility functions for managing groups of persisted forms
 */

import { DEFAULT_KEY_PREFIX } from '../core/constants';
import { isSSR } from '../storage';

/**
 * Clear all persisted forms that match a prefix
 *
 * Useful for clearing related forms, e.g., all checkout steps:
 * - checkout:step1
 * - checkout:step2
 * - checkout:step3
 *
 * @param prefix - The prefix to match (will be prepended with default key prefix)
 * @param storage - Storage to use (defaults to localStorage)
 * @returns Number of items cleared
 *
 * @example
 * ```typescript
 * // Clear all checkout-related forms
 * const cleared = clearGroup('checkout');
 * console.log(`Cleared ${cleared} items`);
 *
 * // Clear with custom storage
 * clearGroup('wizard', sessionStorage);
 * ```
 */
export function clearGroup(
  prefix: string,
  /* istanbul ignore next -- @preserve Default storage fallback */
  storage: Storage = typeof localStorage !== 'undefined' ? localStorage : ({} as Storage)
): number {
  /* istanbul ignore if -- @preserve SSR check */
  if (isSSR()) return 0;

  const fullPrefix = `${DEFAULT_KEY_PREFIX}${prefix}`;
  const keysToRemove: string[] = [];

  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(fullPrefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      try {
        storage.removeItem(key);
      } catch /* istanbul ignore next -- @preserve Individual removal error */ {
        // Ignore individual removal errors
      }
    });

    return keysToRemove.length;
  } catch {
    return 0;
  }
}

/**
 * Get all persisted form keys matching a prefix
 *
 * @param prefix - The prefix to match
 * @param storage - Storage to use
 * @returns Array of matching keys (without the default prefix)
 *
 * @example
 * ```typescript
 * const checkoutForms = getGroupKeys('checkout');
 * // ['checkout:step1', 'checkout:step2']
 * ```
 */
export function getGroupKeys(
  prefix: string,
  /* istanbul ignore next -- @preserve Default storage fallback */
  storage: Storage = typeof localStorage !== 'undefined' ? localStorage : ({} as Storage)
): string[] {
  /* istanbul ignore if -- @preserve SSR check */
  if (isSSR()) return [];

  const fullPrefix = `${DEFAULT_KEY_PREFIX}${prefix}`;
  const keys: string[] = [];

  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(fullPrefix)) {
        // Return without the default prefix
        keys.push(key.slice(DEFAULT_KEY_PREFIX.length));
      }
    }
  } catch /* istanbul ignore next -- @preserve Storage access error */ {
    // Storage access error
  }

  return keys;
}

/**
 * Check if any forms exist in a group
 *
 * @param prefix - The prefix to check
 * @param storage - Storage to use
 * @returns boolean indicating if any forms exist
 *
 * @example
 * ```typescript
 * if (hasGroupData('checkout')) {
 *   console.log('User has checkout data saved');
 * }
 * ```
 */
export function hasGroupData(
  prefix: string,
  /* istanbul ignore next -- @preserve Default storage fallback */
  storage: Storage = typeof localStorage !== 'undefined' ? localStorage : ({} as Storage)
): boolean {
  return getGroupKeys(prefix, storage).length > 0;
}

/**
 * Get total size of all forms in a group
 *
 * @param prefix - The prefix to check
 * @param storage - Storage to use
 * @returns Total size in bytes
 */
export function getGroupSize(
  prefix: string,
  /* istanbul ignore next -- @preserve Default storage fallback */
  storage: Storage = typeof localStorage !== 'undefined' ? localStorage : ({} as Storage)
): number {
  /* istanbul ignore if -- @preserve SSR check */
  if (isSSR()) return 0;

  const fullPrefix = `${DEFAULT_KEY_PREFIX}${prefix}`;
  let totalSize = 0;

  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(fullPrefix)) {
        const value = storage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
        }
      }
    }
  } catch {
    // Storage access error
  }

  return totalSize * 2; // Approximate UTF-16 byte size
}
