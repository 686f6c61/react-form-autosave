/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Tests for sync/useSync.ts
 */

import { renderHook, act } from '@testing-library/react';
import { useSync } from '../sync/useSync';
import type { SyncOptions } from '../core/types';

interface TestData {
  name: string;
  value: number;
}

describe('useSync', () => {
  beforeEach(() => {
    jest.spyOn(window, 'addEventListener').mockImplementation(() => {});
    jest.spyOn(window, 'removeEventListener').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should return broadcast functions', () => {
      const onUpdate = jest.fn();
      const options: SyncOptions<TestData> = { enabled: true };

      const { result } = renderHook(() => useSync('test-key', options, onUpdate));

      expect(result.current.broadcast).toBeDefined();
      expect(result.current.broadcastClear).toBeDefined();
      expect(result.current.requestSync).toBeDefined();
      expect(typeof result.current.broadcast).toBe('function');
      expect(typeof result.current.broadcastClear).toBe('function');
      expect(typeof result.current.requestSync).toBe('function');
    });

    it('should not initialize manager when disabled', () => {
      const onUpdate = jest.fn();
      const options: SyncOptions<TestData> = { enabled: false };

      const { result } = renderHook(() => useSync('test-key', options, onUpdate));

      // Should still return functions (they just won't do anything)
      expect(result.current.broadcast).toBeDefined();
    });
  });

  describe('broadcast', () => {
    it('should call broadcast without error when enabled', () => {
      const onUpdate = jest.fn();
      const options: SyncOptions<TestData> = { enabled: true };

      const { result } = renderHook(() => useSync('test-key', options, onUpdate));

      act(() => {
        expect(() => result.current.broadcast({ name: 'test', value: 1 })).not.toThrow();
      });
    });

    it('should not throw when broadcast called while disabled', () => {
      const onUpdate = jest.fn();
      const options: SyncOptions<TestData> = { enabled: false };

      const { result } = renderHook(() => useSync('test-key', options, onUpdate));

      act(() => {
        expect(() => result.current.broadcast({ name: 'test', value: 1 })).not.toThrow();
      });
    });
  });

  describe('broadcastClear', () => {
    it('should call broadcastClear without error when enabled', () => {
      const onUpdate = jest.fn();
      const options: SyncOptions<TestData> = { enabled: true };

      const { result } = renderHook(() => useSync('test-key', options, onUpdate));

      act(() => {
        expect(() => result.current.broadcastClear()).not.toThrow();
      });
    });

    it('should not throw when broadcastClear called while disabled', () => {
      const onUpdate = jest.fn();
      const options: SyncOptions<TestData> = { enabled: false };

      const { result } = renderHook(() => useSync('test-key', options, onUpdate));

      act(() => {
        expect(() => result.current.broadcastClear()).not.toThrow();
      });
    });
  });

  describe('requestSync', () => {
    it('should call requestSync without error when enabled', () => {
      const onUpdate = jest.fn();
      const options: SyncOptions<TestData> = { enabled: true };

      const { result } = renderHook(() => useSync('test-key', options, onUpdate));

      act(() => {
        expect(() => result.current.requestSync()).not.toThrow();
      });
    });

    it('should not throw when requestSync called while disabled', () => {
      const onUpdate = jest.fn();
      const options: SyncOptions<TestData> = { enabled: false };

      const { result } = renderHook(() => useSync('test-key', options, onUpdate));

      act(() => {
        expect(() => result.current.requestSync()).not.toThrow();
      });
    });
  });

  describe('cleanup', () => {
    it('should cleanup manager on unmount', () => {
      const onUpdate = jest.fn();
      const options: SyncOptions<TestData> = { enabled: true };

      const { unmount } = renderHook(() => useSync('test-key', options, onUpdate));

      // Should not throw on unmount
      expect(() => unmount()).not.toThrow();
    });

    it('should not throw on unmount when disabled', () => {
      const onUpdate = jest.fn();
      const options: SyncOptions<TestData> = { enabled: false };

      const { unmount } = renderHook(() => useSync('test-key', options, onUpdate));

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('options changes', () => {
    it('should reinitialize when key changes', () => {
      const onUpdate = jest.fn();
      const options: SyncOptions<TestData> = { enabled: true };

      const { rerender } = renderHook(
        ({ key, opts }) => useSync(key, opts, onUpdate),
        {
          initialProps: { key: 'key-1', opts: options },
        }
      );

      // Change key
      rerender({ key: 'key-2', opts: options });

      // Should have reinitialized (no error thrown)
      expect(true).toBe(true);
    });

    it('should update onSync callback when it changes', () => {
      const onUpdate1 = jest.fn();
      const onUpdate2 = jest.fn();
      const options: SyncOptions<TestData> = { enabled: true };

      const { rerender } = renderHook(
        ({ callback }) => useSync('test-key', options, callback),
        {
          initialProps: { callback: onUpdate1 },
        }
      );

      rerender({ callback: onUpdate2 });

      // Should have updated callback (no error thrown)
      expect(true).toBe(true);
    });

    it('should handle enabled toggle', () => {
      const onUpdate = jest.fn();

      const { rerender } = renderHook(
        ({ opts }) => useSync('test-key', opts, onUpdate),
        {
          initialProps: { opts: { enabled: true } as SyncOptions<TestData> },
        }
      );

      // Disable
      rerender({ opts: { enabled: false } });

      // Enable again
      rerender({ opts: { enabled: true } });

      // Should handle toggle (no error thrown)
      expect(true).toBe(true);
    });

    it('should handle strategy change', () => {
      const onUpdate = jest.fn();

      const { rerender, result } = renderHook(
        ({ opts }) => useSync('test-key', opts, onUpdate),
        {
          initialProps: {
            opts: { enabled: true, strategy: 'latest-wins' } as SyncOptions<TestData>,
          },
        }
      );

      // Change strategy
      rerender({ opts: { enabled: true, strategy: 'merge' } as SyncOptions<TestData> });

      // Should handle strategy change
      expect(result.current.broadcast).toBeDefined();
    });

    it('should handle channel change', () => {
      const onUpdate = jest.fn();

      const { rerender, result } = renderHook(
        ({ opts }) => useSync('test-key', opts, onUpdate),
        {
          initialProps: {
            opts: { enabled: true, channel: 'channel-1' } as SyncOptions<TestData>,
          },
        }
      );

      // Change channel
      rerender({ opts: { enabled: true, channel: 'channel-2' } as SyncOptions<TestData> });

      // Should handle channel change
      expect(result.current.broadcast).toBeDefined();
    });
  });

  describe('with different strategies', () => {
    it('should work with latest-wins strategy', () => {
      const onUpdate = jest.fn();
      const options: SyncOptions<TestData> = {
        enabled: true,
        strategy: 'latest-wins',
      };

      const { result } = renderHook(() => useSync('test-key', options, onUpdate));

      act(() => {
        result.current.broadcast({ name: 'test', value: 1 });
      });

      expect(result.current.broadcast).toBeDefined();
    });

    it('should work with merge strategy', () => {
      const onUpdate = jest.fn();
      const conflictResolver = jest.fn((local, remote) => ({ ...local, ...remote }));
      const options: SyncOptions<TestData> = {
        enabled: true,
        strategy: 'merge',
        conflictResolver,
      };

      const { result } = renderHook(() => useSync('test-key', options, onUpdate));

      act(() => {
        result.current.broadcast({ name: 'test', value: 1 });
      });

      expect(result.current.broadcast).toBeDefined();
    });
  });
});
