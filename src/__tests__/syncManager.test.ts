/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Tests for sync/syncManager.ts
 */

import { SyncManager, createSyncManager } from '../sync/syncManager';

describe('syncManager', () => {
  let storageEventHandler: ((event: StorageEvent) => void) | null = null;

  beforeEach(() => {
    // Capture the storage event handler
    jest.spyOn(window, 'addEventListener').mockImplementation((type, handler) => {
      if (type === 'storage') {
        storageEventHandler = handler as (event: StorageEvent) => void;
      }
    });
    jest.spyOn(window, 'removeEventListener').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    storageEventHandler = null;
  });

  describe('SyncManager', () => {
    it('should create instance with key and options', () => {
      const manager = new SyncManager('test-key', {
        strategy: 'latest-wins',
      });

      expect(manager).toBeDefined();
      manager.destroy();
    });

    it('should register sync callback', () => {
      const manager = new SyncManager('test-key');
      const callback = jest.fn();

      manager.onSync(callback);
      manager.destroy();
    });

    describe('broadcast', () => {
      it('should broadcast data', () => {
        const manager = new SyncManager('test-key');
        const data = { name: 'John' };

        // Should not throw
        expect(() => manager.broadcast(data)).not.toThrow();
        manager.destroy();
      });

      it('should not broadcast after destroy', () => {
        const manager = new SyncManager('test-key');
        manager.destroy();

        // Should not throw
        expect(() => manager.broadcast({ name: 'John' })).not.toThrow();
      });
    });

    describe('broadcastClear', () => {
      it('should broadcast clear message', () => {
        const manager = new SyncManager('test-key');

        expect(() => manager.broadcastClear()).not.toThrow();
        manager.destroy();
      });

      it('should not broadcast clear after destroy', () => {
        const manager = new SyncManager('test-key');
        manager.destroy();

        expect(() => manager.broadcastClear()).not.toThrow();
      });
    });

    describe('requestSync', () => {
      it('should request sync from other tabs', () => {
        const manager = new SyncManager('test-key');

        expect(() => manager.requestSync()).not.toThrow();
        manager.destroy();
      });

      it('should not request sync after destroy', () => {
        const manager = new SyncManager('test-key');
        manager.destroy();

        expect(() => manager.requestSync()).not.toThrow();
      });
    });

    describe('destroy', () => {
      it('should clean up resources', () => {
        const manager = new SyncManager('test-key');
        manager.destroy();

        expect(window.removeEventListener).toHaveBeenCalledWith(
          'storage',
          expect.any(Function)
        );
      });

      it('should be idempotent', () => {
        const manager = new SyncManager('test-key');
        manager.destroy();

        expect(() => manager.destroy()).not.toThrow();
      });
    });

    describe('onSync callback', () => {
      it('should allow registering a callback', () => {
        const manager = new SyncManager('test-key');
        const callback = jest.fn();

        manager.onSync(callback);

        // Callback is registered, manager can be used
        expect(manager).toBeDefined();
        manager.destroy();
      });
    });

    describe('strategies', () => {
      it('should accept latest-wins strategy', () => {
        const manager = new SyncManager('test-key', {
          strategy: 'latest-wins',
        });

        expect(manager).toBeDefined();
        manager.destroy();
      });

      it('should accept merge strategy with conflict resolver', () => {
        const conflictResolver = jest.fn((local, remote) => ({
          ...local,
          ...remote,
        }));
        const manager = new SyncManager('test-key', {
          strategy: 'merge',
          conflictResolver,
        });

        expect(manager).toBeDefined();
        manager.destroy();
      });

      it('should accept custom channel name', () => {
        const manager = new SyncManager('test-key', {
          channel: 'custom-channel',
        });

        expect(manager).toBeDefined();
        manager.destroy();
      });

      it('should accept onSync callback in options', () => {
        const onSync = jest.fn();
        const manager = new SyncManager('test-key', {
          onSync,
        });

        expect(manager).toBeDefined();
        manager.destroy();
      });
    });

    describe('storage events', () => {
      it('should add storage event listener', () => {
        const manager = new SyncManager('test-key');

        expect(window.addEventListener).toHaveBeenCalledWith(
          'storage',
          expect.any(Function)
        );

        manager.destroy();
      });

      it('should remove storage event listener on destroy', () => {
        const manager = new SyncManager('test-key');
        manager.destroy();

        expect(window.removeEventListener).toHaveBeenCalledWith(
          'storage',
          expect.any(Function)
        );
      });

      it('should handle storage event with valid data', () => {
        const onSync = jest.fn();
        const manager = new SyncManager('test-key', { onSync });

        // Simulate storage event
        if (storageEventHandler) {
          const event = {
            key: 'test-key',
            newValue: JSON.stringify({ data: { name: 'synced' } }),
            oldValue: null,
          } as StorageEvent;

          storageEventHandler(event);
        }

        expect(onSync).toHaveBeenCalledWith({ name: 'synced' }, 'storage');
        manager.destroy();
      });

      it('should handle storage event with null newValue (clear)', () => {
        const onSync = jest.fn();
        const manager = new SyncManager('test-key', { onSync });

        // Simulate clear event
        if (storageEventHandler) {
          const event = {
            key: 'test-key',
            newValue: null,
            oldValue: JSON.stringify({ data: { name: 'old' } }),
          } as StorageEvent;

          storageEventHandler(event);
        }

        expect(onSync).toHaveBeenCalledWith(undefined, 'storage');
        manager.destroy();
      });

      it('should ignore storage event for different key', () => {
        const onSync = jest.fn();
        const manager = new SyncManager('test-key', { onSync });

        // Simulate storage event for different key
        if (storageEventHandler) {
          const event = {
            key: 'different-key',
            newValue: JSON.stringify({ data: { name: 'other' } }),
          } as StorageEvent;

          storageEventHandler(event);
        }

        expect(onSync).not.toHaveBeenCalled();
        manager.destroy();
      });

      it('should handle invalid JSON in storage event', () => {
        const onSync = jest.fn();
        const manager = new SyncManager('test-key', { onSync });

        // Simulate storage event with invalid JSON
        if (storageEventHandler) {
          const event = {
            key: 'test-key',
            newValue: 'not valid json {{{',
          } as StorageEvent;

          storageEventHandler(event);
        }

        // Should not throw and should not call onSync
        expect(onSync).not.toHaveBeenCalled();
        manager.destroy();
      });

      it('should ignore storage event after destroy', () => {
        const onSync = jest.fn();
        const manager = new SyncManager('test-key', { onSync });
        manager.destroy();

        // Simulate storage event after destroy
        if (storageEventHandler) {
          const event = {
            key: 'test-key',
            newValue: JSON.stringify({ data: { name: 'synced' } }),
          } as StorageEvent;

          storageEventHandler(event);
        }

        expect(onSync).not.toHaveBeenCalled();
      });

      it('should handle storage event without data property', () => {
        const onSync = jest.fn();
        const manager = new SyncManager('test-key', { onSync });

        // Simulate storage event with JSON that doesn't have data
        if (storageEventHandler) {
          const event = {
            key: 'test-key',
            newValue: JSON.stringify({ something: 'else' }),
          } as StorageEvent;

          storageEventHandler(event);
        }

        // Should not call onSync when data property is missing
        expect(onSync).not.toHaveBeenCalled();
        manager.destroy();
      });
    });

    describe('handleIncomingData with strategies', () => {
      it('should handle latest-wins strategy', () => {
        const onSync = jest.fn();
        const callback = jest.fn();
        const manager = new SyncManager('test-key', {
          strategy: 'latest-wins',
          onSync,
        });

        manager.onSync(callback);

        // Simulate storage event
        if (storageEventHandler) {
          const event = {
            key: 'test-key',
            newValue: JSON.stringify({ data: { name: 'latest' } }),
          } as StorageEvent;

          storageEventHandler(event);
        }

        expect(callback).toHaveBeenCalledWith({ name: 'latest' }, 'storage');
        expect(onSync).toHaveBeenCalledWith({ name: 'latest' }, 'storage');
        manager.destroy();
      });

      it('should handle merge strategy with conflict resolver', () => {
        const conflictResolver = jest.fn((local, remote) => ({
          ...local,
          ...remote,
        }));
        const onSync = jest.fn();
        const callback = jest.fn();
        const manager = new SyncManager('test-key', {
          strategy: 'merge',
          conflictResolver,
          onSync,
        });

        manager.onSync(callback);

        // Simulate storage event
        if (storageEventHandler) {
          const event = {
            key: 'test-key',
            newValue: JSON.stringify({ data: { name: 'merged' } }),
          } as StorageEvent;

          storageEventHandler(event);
        }

        expect(callback).toHaveBeenCalledWith({ name: 'merged' }, 'storage');
        expect(onSync).toHaveBeenCalledWith({ name: 'merged' }, 'storage');
        manager.destroy();
      });

      it('should handle merge strategy without conflict resolver', () => {
        const onSync = jest.fn();
        const callback = jest.fn();
        const manager = new SyncManager('test-key', {
          strategy: 'merge',
          // No conflict resolver
          onSync,
        });

        manager.onSync(callback);

        // Simulate storage event
        if (storageEventHandler) {
          const event = {
            key: 'test-key',
            newValue: JSON.stringify({ data: { name: 'default' } }),
          } as StorageEvent;

          storageEventHandler(event);
        }

        expect(callback).toHaveBeenCalledWith({ name: 'default' }, 'storage');
        manager.destroy();
      });

      it('should handle undefined strategy (defaults to latest-wins)', () => {
        const onSync = jest.fn();
        const manager = new SyncManager('test-key', { onSync });

        // Simulate storage event
        if (storageEventHandler) {
          const event = {
            key: 'test-key',
            newValue: JSON.stringify({ data: { name: 'default' } }),
          } as StorageEvent;

          storageEventHandler(event);
        }

        expect(onSync).toHaveBeenCalledWith({ name: 'default' }, 'storage');
        manager.destroy();
      });
    });
  });

  describe('createSyncManager', () => {
    it('should create a new SyncManager instance', () => {
      const manager = createSyncManager('test-key');

      expect(manager).toBeInstanceOf(SyncManager);
      manager.destroy();
    });

    it('should accept options', () => {
      const onSync = jest.fn();
      const manager = createSyncManager('test-key', {
        strategy: 'latest-wins',
        onSync,
      });

      expect(manager).toBeInstanceOf(SyncManager);
      manager.destroy();
    });

    it('should create manager with default options', () => {
      const manager = createSyncManager('test-key', {});

      expect(manager).toBeInstanceOf(SyncManager);
      manager.destroy();
    });
  });
});
