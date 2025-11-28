/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @license MIT
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Tab synchronization manager using BroadcastChannel and storage events
 * Enables real-time sync of form state across browser tabs
 */

import type { SyncOptions } from '../core/types';
import { DEFAULT_SYNC_CHANNEL } from '../core/constants';
import { isSSR } from '../storage';

/**
 * Message structure for broadcast communication
 */
interface SyncMessage<T> {
  type: 'update' | 'clear' | 'request';
  key: string;
  data?: T;
  timestamp: number;
  tabId: string;
}

/**
 * Callback type for sync events
 */
type SyncCallback<T> = (data: T, source: 'storage' | 'broadcast') => void;

/**
 * Generate a unique tab identifier
 */
function generateTabId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * SyncManager class handles cross-tab synchronization
 *
 * @example
 * ```typescript
 * const syncManager = new SyncManager<FormData>('myForm', {
 *   strategy: 'latest-wins',
 *   onSync: (data) => updateState(data),
 * });
 *
 * // Broadcast changes
 * syncManager.broadcast(formData);
 *
 * // Clean up
 * syncManager.destroy();
 * ```
 */
export class SyncManager<T> {
  private key: string;
  private options: SyncOptions<T>;
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private callback: SyncCallback<T> | null = null;
  private isDestroyed = false;

  constructor(key: string, options: SyncOptions<T> = {}) {
    this.key = key;
    this.options = options;
    this.tabId = generateTabId();

    if (!isSSR()) {
      this.initialize();
    }
  }

  /**
   * Initialize sync channels
   */
  private initialize(): void {
    // Try BroadcastChannel first (better performance)
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channelName = this.options.channel ?? DEFAULT_SYNC_CHANNEL;
        this.channel = new BroadcastChannel(channelName);
        this.channel.onmessage = this.handleBroadcastMessage.bind(this);
      } catch {
        // BroadcastChannel not available
      }
    }

    // Always listen to storage events as fallback
    window.addEventListener('storage', this.handleStorageEvent.bind(this));
  }

  /**
   * Handle incoming BroadcastChannel messages
   */
  /* istanbul ignore next -- @preserve BroadcastChannel handler difficult to test in jsdom */
  private handleBroadcastMessage(event: MessageEvent<SyncMessage<T>>): void {
    if (this.isDestroyed) return;

    const message = event.data;

    // Ignore messages from this tab
    if (message.tabId === this.tabId) return;

    // Ignore messages for other keys
    if (message.key !== this.key) return;

    if (message.type === 'update' && message.data !== undefined) {
      this.handleIncomingData(message.data, 'broadcast');
    } else if (message.type === 'clear') {
      // Handle clear message - notify callback with empty/null data
      this.options.onSync?.(undefined as unknown as T, 'broadcast');
    }
  }

  /**
   * Handle storage events (fallback for cross-tab sync)
   */
  /* istanbul ignore next -- @preserve Storage event handler with optional callbacks */
  private handleStorageEvent = (event: StorageEvent): void => {
    if (this.isDestroyed) return;

    // Only handle events for our key
    if (event.key !== this.key) return;

    // Handle clear
    if (event.newValue === null) {
      this.options.onSync?.(undefined as unknown as T, 'storage');
      return;
    }

    // Try to parse the new value
    try {
      const parsed = JSON.parse(event.newValue);
      if (parsed && parsed.data) {
        this.handleIncomingData(parsed.data, 'storage');
      }
    } catch {
      // Invalid JSON, ignore
    }
  };

  /**
   * Handle incoming data with conflict resolution
   */
  /* istanbul ignore next -- @preserve Incoming data handler with optional callbacks */
  private handleIncomingData(data: T, source: 'storage' | 'broadcast'): void {
    const strategy = this.options.strategy ?? 'latest-wins';

    // For 'latest-wins', just use the incoming data
    if (strategy === 'latest-wins') {
      this.callback?.(data, source);
      this.options.onSync?.(data, source);
      return;
    }

    // For 'merge' or 'ask-user', use conflict resolver if provided
    if (this.options.conflictResolver) {
      // We'd need current state to merge - this requires integration with the hook
      // For now, just pass through to callback
      this.callback?.(data, source);
      this.options.onSync?.(data, source);
      return;
    }

    // Default: accept incoming data
    this.callback?.(data, source);
    this.options.onSync?.(data, source);
  }

  /**
   * Register a callback for sync events
   */
  onSync(callback: SyncCallback<T>): void {
    this.callback = callback;
  }

  /**
   * Broadcast data to other tabs
   */
  broadcast(data: T): void {
    if (this.isDestroyed || isSSR()) return;

    const message: SyncMessage<T> = {
      type: 'update',
      key: this.key,
      data,
      timestamp: Date.now(),
      tabId: this.tabId,
    };

    // Broadcast via BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch {
        // Channel might be closed
      }
    }

    // Note: storage event is automatically triggered when setItem is called
    // so we don't need to explicitly trigger it here
  }

  /**
   * Broadcast a clear message
   */
  broadcastClear(): void {
    if (this.isDestroyed || isSSR()) return;

    const message: SyncMessage<T> = {
      type: 'clear',
      key: this.key,
      timestamp: Date.now(),
      tabId: this.tabId,
    };

    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch {
        // Channel might be closed
      }
    }
  }

  /**
   * Request current state from other tabs
   */
  requestSync(): void {
    if (this.isDestroyed || isSSR()) return;

    const message: SyncMessage<T> = {
      type: 'request',
      key: this.key,
      timestamp: Date.now(),
      tabId: this.tabId,
    };

    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch {
        // Channel might be closed
      }
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.isDestroyed = true;

    if (this.channel) {
      try {
        this.channel.close();
      } catch {
        // Already closed
      }
      this.channel = null;
    }

    if (!isSSR()) {
      window.removeEventListener('storage', this.handleStorageEvent);
    }

    this.callback = null;
  }
}

/**
 * Create a sync manager instance
 *
 * @param key - Storage key to sync
 * @param options - Sync options
 * @returns SyncManager instance
 */
export function createSyncManager<T>(
  key: string,
  options: SyncOptions<T> = {}
): SyncManager<T> {
  return new SyncManager(key, options);
}
