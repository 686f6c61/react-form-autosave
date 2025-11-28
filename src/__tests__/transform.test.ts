/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Tests for middleware/transform.ts
 */

import {
  defaultSerialize,
  defaultDeserialize,
  base64Encode,
  base64Decode,
  simpleCompress,
  simpleDecompress,
  createTransformPipeline,
  wrapWithMetadata,
  unwrapData,
  filterExcludedFields,
} from '../middleware/transform';

describe('transform', () => {
  describe('defaultSerialize', () => {
    it('should serialize objects to JSON', () => {
      const data = { name: 'John', age: 30 };
      expect(defaultSerialize(data)).toBe('{"name":"John","age":30}');
    });

    it('should serialize arrays', () => {
      const data = [1, 2, 3];
      expect(defaultSerialize(data)).toBe('[1,2,3]');
    });

    it('should serialize primitives', () => {
      expect(defaultSerialize('test')).toBe('"test"');
      expect(defaultSerialize(123)).toBe('123');
      expect(defaultSerialize(true)).toBe('true');
      expect(defaultSerialize(null)).toBe('null');
    });
  });

  describe('defaultDeserialize', () => {
    it('should deserialize valid JSON', () => {
      expect(defaultDeserialize('{"name":"John"}')).toEqual({ name: 'John' });
    });

    it('should return null for invalid JSON', () => {
      expect(defaultDeserialize('not valid json')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(defaultDeserialize('')).toBeNull();
    });
  });

  describe('base64Encode and base64Decode', () => {
    it('should encode and decode ASCII strings', () => {
      const original = 'Hello World';
      const encoded = base64Encode(original);
      const decoded = base64Decode(encoded);
      expect(decoded).toBe(original);
    });

    it('should handle Unicode characters', () => {
      const original = 'Hello 世界 🌍';
      const encoded = base64Encode(original);
      const decoded = base64Decode(encoded);
      expect(decoded).toBe(original);
    });

    it('should handle special characters', () => {
      const original = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encoded = base64Encode(original);
      const decoded = base64Decode(encoded);
      expect(decoded).toBe(original);
    });

    it('should handle empty string', () => {
      expect(base64Decode(base64Encode(''))).toBe('');
    });

    it('should return original data on decode error', () => {
      const invalid = '!!!invalid base64!!!';
      expect(base64Decode(invalid)).toBe(invalid);
    });
  });

  describe('simpleCompress and simpleDecompress', () => {
    it('should not compress small data', () => {
      const small = 'small';
      expect(simpleCompress(small)).toBe(small);
    });

    it('should compress data with repeated characters', () => {
      const repeated = 'a'.repeat(2000);
      const compressed = simpleCompress(repeated);
      expect(compressed.length).toBeLessThan(repeated.length);
    });

    it('should decompress compressed data', () => {
      const original = 'a'.repeat(2000);
      const compressed = simpleCompress(original);
      const decompressed = simpleDecompress(compressed);
      expect(decompressed).toBe(original);
    });

    it('should return original if compression does not help', () => {
      const random = 'abcdefghijklmnopqrstuvwxyz'.repeat(50);
      const compressed = simpleCompress(random);
      // Either returns original or compressed version
      expect(simpleDecompress(compressed)).toBe(random);
    });

    it('should handle data without compression marker', () => {
      const uncompressed = 'regular data';
      expect(simpleDecompress(uncompressed)).toBe(uncompressed);
    });
  });

  describe('createTransformPipeline', () => {
    it('should serialize and deserialize with default options', () => {
      const pipeline = createTransformPipeline();
      const data = { name: 'John' };

      const serialized = pipeline.serialize(data);
      const deserialized = pipeline.deserialize(serialized);

      expect(deserialized).toEqual(data);
    });

    it('should use custom serializer', () => {
      const customSerializer = jest.fn((data) => JSON.stringify(data));
      const pipeline = createTransformPipeline({
        serialize: customSerializer,
      });

      pipeline.serialize({ test: true });
      expect(customSerializer).toHaveBeenCalled();
    });

    it('should use custom deserializer', () => {
      const customDeserializer = jest.fn((data) => JSON.parse(data));
      const pipeline = createTransformPipeline({
        deserialize: customDeserializer,
      });

      pipeline.deserialize('{"test":true}');
      expect(customDeserializer).toHaveBeenCalled();
    });

    it('should apply compression when enabled', () => {
      const pipeline = createTransformPipeline(undefined, true);
      const data = { content: 'a'.repeat(2000) };

      const serialized = pipeline.serialize(data);
      const deserialized = pipeline.deserialize(serialized);

      expect(deserialized).toEqual(data);
    });

    it('should apply compression with custom threshold', () => {
      const pipeline = createTransformPipeline(undefined, { threshold: 10 });
      const data = { content: 'test data here' };

      const serialized = pipeline.serialize(data);
      const deserialized = pipeline.deserialize(serialized);

      expect(deserialized).toEqual(data);
    });

    it('should apply base64 encoding when encrypt is true', () => {
      const pipeline = createTransformPipeline(undefined, false, true);
      const data = { secret: 'password123' };

      const serialized = pipeline.serialize(data);
      // Base64 encoded should not contain the original values in plain text
      expect(serialized).not.toContain('password123');

      const deserialized = pipeline.deserialize(serialized);
      expect(deserialized).toEqual(data);
    });

    it('should combine compression and encryption', () => {
      const pipeline = createTransformPipeline(undefined, true, true);
      const data = { content: 'a'.repeat(2000) };

      const serialized = pipeline.serialize(data);
      const deserialized = pipeline.deserialize(serialized);

      expect(deserialized).toEqual(data);
    });

    it('should return null on deserialize error', () => {
      const pipeline = createTransformPipeline(undefined, false, true);
      const result = pipeline.deserialize('invalid data');
      expect(result).toBeNull();
    });
  });

  describe('wrapWithMetadata', () => {
    it('should wrap data with timestamp and version', () => {
      const data = { name: 'John' };
      const wrapped = wrapWithMetadata(data, 1);

      expect(wrapped.data).toEqual(data);
      expect(wrapped.version).toBe(1);
      expect(typeof wrapped.timestamp).toBe('number');
      expect(wrapped.expiresAt).toBeUndefined();
    });

    it('should include expiration when provided', () => {
      const data = { name: 'John' };
      const wrapped = wrapWithMetadata(data, 1, 60);

      expect(wrapped.expiresAt).toBeDefined();
      expect(wrapped.expiresAt).toBeGreaterThan(wrapped.timestamp);
      // 60 minutes in milliseconds
      expect(wrapped.expiresAt! - wrapped.timestamp).toBe(60 * 60 * 1000);
    });

    it('should not include expiration when 0', () => {
      const data = { name: 'John' };
      const wrapped = wrapWithMetadata(data, 1, 0);

      expect(wrapped.expiresAt).toBeUndefined();
    });
  });

  describe('unwrapData', () => {
    it('should return data from valid wrapper', () => {
      const wrapped = {
        data: { name: 'John' },
        timestamp: Date.now(),
        version: 1,
      };

      expect(unwrapData(wrapped)).toEqual({ name: 'John' });
    });

    it('should return null for expired data', () => {
      const wrapped = {
        data: { name: 'John' },
        timestamp: Date.now() - 10000,
        version: 1,
        expiresAt: Date.now() - 5000,
      };

      expect(unwrapData(wrapped)).toBeNull();
    });

    it('should return data when not expired', () => {
      const wrapped = {
        data: { name: 'John' },
        timestamp: Date.now(),
        version: 1,
        expiresAt: Date.now() + 60000,
      };

      expect(unwrapData(wrapped)).toEqual({ name: 'John' });
    });

    it('should return null for invalid wrapper', () => {
      expect(unwrapData(null as any)).toBeNull();
      expect(unwrapData(undefined as any)).toBeNull();
      expect(unwrapData('string' as any)).toBeNull();
    });
  });

  describe('filterExcludedFields', () => {
    it('should remove excluded fields', () => {
      const data = { name: 'John', password: 'secret', email: 'john@test.com' };
      const filtered = filterExcludedFields(data, ['password']);

      expect(filtered).toEqual({ name: 'John', email: 'john@test.com' });
    });

    it('should handle multiple excluded fields', () => {
      const data = { a: 1, b: 2, c: 3, d: 4 };
      const filtered = filterExcludedFields(data, ['b', 'd']);

      expect(filtered).toEqual({ a: 1, c: 3 });
    });

    it('should return original data when exclude is empty', () => {
      const data = { name: 'John' };
      const filtered = filterExcludedFields(data, []);

      expect(filtered).toEqual(data);
    });

    it('should return original data when exclude is undefined', () => {
      const data = { name: 'John' };
      const filtered = filterExcludedFields(data, undefined as any);

      expect(filtered).toEqual(data);
    });

    it('should handle non-existent fields in exclude', () => {
      const data = { name: 'John' };
      const filtered = filterExcludedFields(data, ['nonexistent' as any]);

      expect(filtered).toEqual({ name: 'John' });
    });
  });
});
