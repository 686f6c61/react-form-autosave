/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @license MIT
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Data transformation utilities for serialization, compression, and encryption
 */

import type { TransformOptions, PersistedData } from '../core/types';
import { DEFAULT_COMPRESSION_THRESHOLD } from '../core/constants';

/**
 * Default JSON serializer
 *
 * @param data - Data to serialize
 * @returns JSON string
 */
export function defaultSerialize<T>(data: T): string {
  return JSON.stringify(data);
}

/**
 * Default JSON deserializer with error handling
 *
 * @param data - JSON string to parse
 * @returns Parsed data or null if invalid
 */
export function defaultDeserialize<T>(data: string): T | null {
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

/**
 * Simple Base64 encoding for basic obfuscation
 * NOTE: This is NOT secure encryption, just obfuscation
 *
 * @param data - String to encode
 * @returns Base64 encoded string
 */
export function base64Encode(data: string): string {
  if (typeof btoa !== 'undefined') {
    // Browser environment
    return btoa(encodeURIComponent(data).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    ));
  }
  /* istanbul ignore next -- @preserve Node.js/SSR environment */
  return Buffer.from(data, 'utf-8').toString('base64');
}

/**
 * Simple Base64 decoding
 *
 * @param data - Base64 encoded string
 * @returns Decoded string
 */
export function base64Decode(data: string): string {
  try {
    if (typeof atob !== 'undefined') {
      // Browser environment
      return decodeURIComponent(
        atob(data)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    }
    /* istanbul ignore next -- @preserve Node.js/SSR environment */
    return Buffer.from(data, 'base64').toString('utf-8');
  } catch /* istanbul ignore next -- @preserve Fallback for invalid base64 */ {
    return data;
  }
}

/**
 * Simple LZ-based compression using run-length encoding
 * Lightweight alternative to full LZ compression for small data
 *
 * @param data - String to compress
 * @returns Compressed string
 */
export function simpleCompress(data: string): string {
  // For small data, compression overhead isn't worth it
  if (data.length < DEFAULT_COMPRESSION_THRESHOLD) {
    return data;
  }

  // Simple run-length encoding for repeated characters
  let result = '';
  let count = 1;
  let prevChar = data[0];

  for (let i = 1; i <= data.length; i++) {
    const char = data[i];
    if (char === prevChar && count < 255) {
      count++;
    } else {
      if (count >= 4) {
        // Only encode runs of 4+
        result += `\x00${String.fromCharCode(count)}${prevChar}`;
      } else {
        result += prevChar.repeat(count);
      }
      count = 1;
      prevChar = char;
    }
  }

  // Return original if compression didn't help
  return result.length < data.length ? `\x01${result}` : data;
}

/**
 * Decompress data compressed with simpleCompress
 *
 * @param data - Compressed string
 * @returns Decompressed string
 */
export function simpleDecompress(data: string): string {
  // Check for compression marker
  if (data[0] !== '\x01') {
    return data;
  }

  let result = '';
  let i = 1;

  while (i < data.length) {
    if (data[i] === '\x00') {
      const count = data.charCodeAt(i + 1);
      const char = data[i + 2];
      result += char.repeat(count);
      i += 3;
    } else {
      result += data[i];
      i++;
    }
  }

  return result;
}

/**
 * Creates a transform pipeline for data serialization
 *
 * @param options - Transform options
 * @param compress - Whether to apply compression
 * @param encrypt - Whether to apply obfuscation
 * @returns Transform functions
 */
export function createTransformPipeline<T>(
  options?: TransformOptions<T>,
  compress?: boolean | { threshold?: number },
  encrypt?: boolean
): {
  serialize: (data: T) => string;
  deserialize: (data: string) => T | null;
} {
  const shouldCompress = compress === true || (typeof compress === 'object' && compress !== null);
  /* istanbul ignore next -- @preserve Optional threshold branch */
  const compressionThreshold =
    typeof compress === 'object' ? compress.threshold ?? DEFAULT_COMPRESSION_THRESHOLD : DEFAULT_COMPRESSION_THRESHOLD;

  return {
    serialize: (data: T): string => {
      // Step 1: Custom serialize or default JSON
      let result = options?.serialize ? options.serialize(data) : defaultSerialize(data);

      // Step 2: Compress if enabled and above threshold
      if (shouldCompress && result.length >= compressionThreshold) {
        result = simpleCompress(result);
      }

      // Step 3: Obfuscate if enabled
      if (encrypt) {
        result = base64Encode(result);
      }

      return result;
    },

    deserialize: (data: string): T | null => {
      try {
        let result = data;

        // Step 1: De-obfuscate if encrypted
        if (encrypt) {
          result = base64Decode(result);
        }

        // Step 2: Decompress if compressed
        if (shouldCompress) {
          result = simpleDecompress(result);
        }

        // Step 3: Custom deserialize or default JSON parse
        if (options?.deserialize) {
          return options.deserialize(result);
        }

        return defaultDeserialize<T>(result);
      } catch {
        /* istanbul ignore next -- @preserve Defensive deserialization fallback */
        return null;
      }
    },
  };
}

/**
 * Wrap data with metadata for storage
 *
 * @param data - The data to wrap
 * @param version - Schema version
 * @param expiration - Expiration time in minutes (optional)
 * @returns Wrapped data with metadata
 */
export function wrapWithMetadata<T>(
  data: T,
  version: number,
  expiration?: number
): PersistedData<T> {
  const now = Date.now();
  const wrapped: PersistedData<T> = {
    data,
    timestamp: now,
    version,
  };

  if (expiration !== undefined && expiration > 0) {
    wrapped.expiresAt = now + expiration * 60 * 1000;
  }

  return wrapped;
}

/**
 * Unwrap data and check for expiration
 *
 * @param wrapped - The wrapped data
 * @returns The data if valid, null if expired or invalid
 */
export function unwrapData<T>(wrapped: PersistedData<T>): T | null {
  if (!wrapped || typeof wrapped !== 'object') {
    return null;
  }

  // Check expiration
  if (wrapped.expiresAt && Date.now() > wrapped.expiresAt) {
    return null;
  }

  return wrapped.data;
}

/**
 * Filter out excluded fields from data
 *
 * @param data - The data object
 * @param exclude - Array of field names to exclude
 * @returns Data with excluded fields removed
 */
export function filterExcludedFields<T extends Record<string, unknown>>(
  data: T,
  exclude: (keyof T)[]
): Partial<T> {
  if (!exclude || exclude.length === 0) {
    return data;
  }

  const filtered: Partial<T> = {};
  const excludeSet = new Set(exclude);

  for (const key of Object.keys(data)) {
    if (!excludeSet.has(key as keyof T)) {
      filtered[key as keyof T] = data[key as keyof T];
    }
  }

  return filtered;
}
