/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @license MIT
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * React hook for cross-tab synchronization
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import type { SyncOptions } from '../core/types';
import { SyncManager } from './syncManager';

/**
 * Hook for syncing form state across browser tabs
 *
 * @param key - Storage key
 * @param options - Sync options
 * @param onUpdate - Callback when data is updated from another tab
 * @returns Object with broadcast function
 *
 * @example
 * ```tsx
 * const { broadcast } = useSync('myForm', { strategy: 'latest-wins' }, (data) => {
 *   setFormData(data);
 * });
 *
 * // When local state changes
 * useEffect(() => {
 *   broadcast(formData);
 * }, [formData, broadcast]);
 * ```
 */
export function useSync<T>(
  key: string,
  options: SyncOptions<T>,
  onUpdate: (data: T, source: 'storage' | 'broadcast') => void
): {
  broadcast: (data: T) => void;
  broadcastClear: () => void;
  requestSync: () => void;
} {
  const managerRef = useRef<SyncManager<T> | null>(null);
  const onUpdateRef = useRef(onUpdate);
  const {
    enabled,
    channel,
    strategy,
    conflictResolver,
    onSync,
  } = options;
  const managerOptions = useMemo<SyncOptions<T>>(
    () => ({
      enabled,
      channel,
      strategy,
      conflictResolver,
      onSync,
    }),
    [enabled, channel, strategy, conflictResolver, onSync]
  );

  // Initialize manager
  useEffect(() => {
    if (!enabled) return;

    managerRef.current = new SyncManager(key, managerOptions);
    managerRef.current.onSync((data, source) => {
      onUpdateRef.current(data, source);
    });

    return () => {
      /* istanbul ignore next -- @preserve Cleanup null check */
      if (managerRef.current) {
        managerRef.current.destroy();
      }
      managerRef.current = null;
    };
  }, [key, enabled, managerOptions]);

  // Update callback when it changes
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const broadcast = useCallback((data: T) => {
    managerRef.current?.broadcast(data);
  }, []);

  const broadcastClear = useCallback(() => {
    managerRef.current?.broadcastClear();
  }, []);

  const requestSync = useCallback(() => {
    managerRef.current?.requestSync();
  }, []);

  return { broadcast, broadcastClear, requestSync };
}
