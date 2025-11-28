/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @license MIT
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Main hook for persisting form state
 * Provides a useState-like API with automatic persistence to storage
 */

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';

import type {
  FormPersistOptions,
  FormPersistActions,
  UseFormPersistReturn,
  StorageAdapter,
} from '../core/types';

import {
  DEFAULT_OPTIONS,
  DEFAULT_KEY_PREFIX,
  DEFAULT_MAX_HISTORY,
} from '../core/constants';

import { getStorageAdapter, isSSR, getStringByteSize } from '../storage';

import {
  createSaveController,
  createTransformPipeline,
  wrapWithMetadata,
  filterExcludedFields,
  getMergeFunction,
  isValidPersistedData,
  isExpired,
  migrateData,
  createErrorInfo,
  detectErrorType,
  validateData,
  isEqual,
} from '../middleware';

import { useFormPersistContext } from '../components/FormPersistProvider';

/**
 * Debug logger utility
 */
function debugLog(enabled: boolean, ...args: unknown[]): void {
  if (enabled && typeof console !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log('[react-form-autosave]', ...args);
  }
}

/**
 * Main hook for persisting form state to storage
 *
 * @param key - Unique key for storing data
 * @param initialState - Initial state value
 * @param options - Configuration options
 * @returns Tuple of [state, setState, actions]
 *
 * @example
 * ```tsx
 * // Basic usage
 * const [formData, setFormData, { clear }] = useFormPersist('myForm', {
 *   name: '',
 *   email: '',
 * });
 *
 * // With options
 * const [formData, setFormData, actions] = useFormPersist(
 *   'checkout',
 *   { items: [], total: 0 },
 *   {
 *     debounce: 1000,
 *     expiration: 60, // 1 hour
 *     exclude: ['creditCard'],
 *     onRestore: (data) => console.log('Restored:', data),
 *   }
 * );
 *
 * // Clear after successful submit
 * const handleSubmit = actions.withClear(async () => {
 *   await api.submit(formData);
 * });
 * ```
 */
export function useFormPersist<T extends Record<string, unknown>>(
  key: string,
  initialState: T,
  options: FormPersistOptions<T> = {}
): UseFormPersistReturn<T> {
  // Merge with context defaults
  const contextDefaults = useFormPersistContext();
  const mergedOptions = useMemo(
    () => ({
      ...DEFAULT_OPTIONS,
      ...contextDefaults,
      ...options,
    }),
    [contextDefaults, options]
  );

  const {
    storage: storageType,
    debounce: debounceMs,
    throttle: throttleMs,
    expiration,
    exclude,
    transform,
    onRestore,
    onError,
    onStorageFull,
    merge: mergeStrategy,
    version,
    migrate,
    compress,
    enabled,
    validate,
    beforePersist,
    debug,
    keyPrefix,
    warnSize,
  } = mergedOptions;

  // Compute full storage key
  /* istanbul ignore next -- @preserve Optional chaining branches */
  const fullKey = useMemo(() => {
    const prefix = keyPrefix ?? DEFAULT_KEY_PREFIX;
    return `${prefix}${key}`;
  }, [key, keyPrefix]);

  // Get storage adapter
  const storage = useMemo<StorageAdapter>(
    () => getStorageAdapter(storageType),
    [storageType]
  );

  // Create transform pipeline
  const transformer = useMemo(
    () => createTransformPipeline(transform, compress, false),
    [transform, compress]
  );

  // Get merge function
  const mergeFn = useMemo(() => getMergeFunction(mergeStrategy), [mergeStrategy]);

  // State
  const [state, setStateInternal] = useState<T>(initialState);
  const [isPersisted, setIsPersisted] = useState(false);
  const [isRestored, setIsRestored] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [size, setSize] = useState(0);

  // History state for undo/redo
  const [history, setHistory] = useState<T[]>([initialState]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Refs
  const stateRef = useRef(state);
  const initialStateRef = useRef(initialState);
  const isMountedRef = useRef(false);

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Error handler
  /* istanbul ignore next -- @preserve Error handler callback branches */
  const handleError = useCallback(
    (type: Parameters<typeof createErrorInfo>[0], message: string, error?: Error) => {
      const errorInfo = createErrorInfo(type, fullKey, message, error);
      debugLog(debug ?? false, 'Error:', errorInfo);

      if (type === 'QUOTA_EXCEEDED' || type === 'STORAGE_FULL') {
        onStorageFull?.(errorInfo);
      }
      onError?.(errorInfo);
    },
    [fullKey, debug, onStorageFull, onError]
  );

  // Save to storage function
  /* istanbul ignore next -- @preserve Save function with optional branches */
  const saveToStorage = useCallback(
    (dataToSave: T) => {
      if (!enabled || isPaused || isSSR()) {
        return;
      }

      try {
        // Apply beforePersist transform
        let processedData = beforePersist ? beforePersist(dataToSave) : dataToSave;

        // Filter excluded fields
        if (exclude && exclude.length > 0) {
          processedData = filterExcludedFields(processedData, exclude) as T;
        }

        // Validate data
        if (!validateData(processedData, validate)) {
          debugLog(debug ?? false, 'Validation failed, skipping save');
          return;
        }

        // Wrap with metadata
        const wrapped = wrapWithMetadata(processedData, version ?? 1, expiration);

        // Serialize
        const serialized = transformer.serialize(wrapped);

        // Check size warning
        const dataSize = getStringByteSize(serialized);
        if (warnSize && dataSize > warnSize) {
          console.warn(
            `[react-form-autosave] Data size (${dataSize} bytes) exceeds warning threshold (${warnSize} bytes)`
          );
        }

        // Save to storage
        storage.setItem(fullKey, serialized);

        setIsPersisted(true);
        setLastSaved(Date.now());
        setSize(dataSize);
        debugLog(debug ?? false, 'Saved to storage:', fullKey);
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        const errorType = detectErrorType(error);
        handleError(errorType, error.message, error);
      }
    },
    [
      enabled,
      isPaused,
      beforePersist,
      exclude,
      validate,
      version,
      expiration,
      transformer,
      warnSize,
      storage,
      fullKey,
      debug,
      handleError,
    ]
  );

  // Create debounced save controller
  /* istanbul ignore next -- @preserve SaveController with optional debounce/throttle */
  const saveController = useMemo(
    () => createSaveController(saveToStorage, debounceMs ?? 500, throttleMs),
    [saveToStorage, debounceMs, throttleMs]
  );

  // Load from storage on mount
  /* istanbul ignore next -- @preserve Load effect with optional branches */
  useEffect(() => {
    if (isSSR() || !enabled || isMountedRef.current) {
      return;
    }

    isMountedRef.current = true;

    const loadFromStorage = async () => {
      try {
        const raw = await storage.getItem(fullKey);

        if (!raw) {
          debugLog(debug ?? false, 'No stored data found for:', fullKey);
          return;
        }

        // Deserialize
        const parsed = transformer.deserialize(raw);

        if (!parsed) {
          handleError('CORRUPTED_DATA', 'Failed to parse stored data');
          return;
        }

        // Validate structure
        if (!isValidPersistedData<T>(parsed)) {
          handleError('CORRUPTED_DATA', 'Invalid data structure');
          return;
        }

        // Check expiration
        if (isExpired(parsed)) {
          debugLog(debug ?? false, 'Stored data expired, clearing');
          storage.removeItem(fullKey);
          return;
        }

        // Migrate if needed
        let data = migrateData(
          parsed.data,
          parsed.version,
          version ?? 1,
          migrate
        );

        if (data === null) {
          handleError('MIGRATION_FAILED', 'Failed to migrate data');
          return;
        }

        // Merge with initial state
        data = mergeFn(data as Partial<T>, initialState);

        // Update state
        setStateInternal(data);
        setIsPersisted(true);
        setIsRestored(true);
        setLastSaved(parsed.timestamp);
        setHistory([data]);
        setHistoryIndex(0);

        // Call onRestore callback
        onRestore?.(data);
        debugLog(debug ?? false, 'Restored from storage:', fullKey);
      } catch (e) /* istanbul ignore next -- @preserve Defensive error handling */ {
        const error = e instanceof Error ? e : new Error(String(e));
        handleError('UNKNOWN', error.message, error);
      }
    };

    loadFromStorage();
  }, [
    fullKey,
    enabled,
    storage,
    transformer,
    version,
    migrate,
    mergeFn,
    initialState,
    onRestore,
    debug,
    handleError,
  ]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      saveController.flush();
    };
  }, [saveController]);

  // Custom setState that triggers save
  /* istanbul ignore next -- @preserve setState with optional history branches */
  const setState = useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (action) => {
      setStateInternal((prevState) => {
        const newState =
          typeof action === 'function'
            ? (action as (prev: T) => T)(prevState)
            : action;

        // Update history if enabled
        if (mergedOptions.history) {
          const maxHistory =
            typeof mergedOptions.history === 'object'
              ? mergedOptions.history.maxHistory ?? DEFAULT_MAX_HISTORY
              : DEFAULT_MAX_HISTORY;

          setHistory((prev) => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(newState);
            /* istanbul ignore if -- @preserve History trimming edge case */
            if (newHistory.length > maxHistory) {
              newHistory.shift();
            }
            return newHistory;
          });
          setHistoryIndex((prev) => Math.min(prev + 1, maxHistory - 1));
        }

        // Schedule save
        saveController.save(newState);

        return newState;
      });
    },
    [saveController, mergedOptions.history, historyIndex]
  );

  // Clear storage
  /* istanbul ignore next -- @preserve Clear function with optional debug */
  const clear = useCallback(() => {
    try {
      storage.removeItem(fullKey);
      setIsPersisted(false);
      setLastSaved(null);
      setSize(0);
      debugLog(debug ?? false, 'Cleared storage:', fullKey);
    } catch (e) /* istanbul ignore next -- @preserve Defensive error handling */ {
      const error = e instanceof Error ? e : new Error(String(e));
      handleError('UNKNOWN', error.message, error);
    }
  }, [storage, fullKey, debug, handleError]);

  // Force save immediately
  const forceSave = useCallback(() => {
    saveController.flush();
    saveToStorage(stateRef.current);
  }, [saveController, saveToStorage]);

  // Pause/resume
  const pause = useCallback(() => {
    setIsPaused(true);
    saveController.cancel();
  }, [saveController]);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  // Undo/redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  /* istanbul ignore next -- @preserve Undo callback with guard */
  const undo = useCallback(() => {
    if (!canUndo) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setStateInternal(history[newIndex]);
    saveController.save(history[newIndex]);
  }, [canUndo, historyIndex, history, saveController]);

  /* istanbul ignore next -- @preserve Redo callback with guard */
  const redo = useCallback(() => {
    if (!canRedo) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setStateInternal(history[newIndex]);
    saveController.save(history[newIndex]);
  }, [canRedo, historyIndex, history, saveController]);

  // withClear wrapper
  const withClear = useCallback(
    <R,>(handler: () => R | Promise<R>) =>
      async (): Promise<R> => {
        const result = await handler();
        clear();
        return result;
      },
    [clear]
  );

  // Reset to initial state
  const reset = useCallback(() => {
    setStateInternal(initialStateRef.current);
    setHistory([initialStateRef.current]);
    setHistoryIndex(0);
    clear();
  }, [clear]);

  // Get persisted value without triggering restore
  /* istanbul ignore next -- @preserve getPersistedValue with optional branches */
  const getPersistedValue = useCallback((): T | null => {
    if (isSSR()) return null;

    try {
      const raw = storage.getItem(fullKey);
      if (!raw || typeof raw !== 'string') return null;

      const parsed = transformer.deserialize(raw);
      if (!parsed || !isValidPersistedData<T>(parsed)) return null;
      if (isExpired(parsed)) return null;

      return parsed.data;
    } catch {
      /* istanbul ignore next -- @preserve Defensive error handling */
      return null;
    }
  }, [storage, fullKey, transformer]);

  // Check if dirty
  const isDirty = useMemo(
    () => !isEqual(state, initialStateRef.current),
    [state]
  );

  // Revert to last saved state
  const revert = useCallback(() => {
    const persisted = getPersistedValue();
    if (persisted) {
      setStateInternal(persisted);
    }
  }, [getPersistedValue]);

  // Build actions object
  const actions: FormPersistActions<T> = useMemo(
    () => ({
      clear,
      isPersisted,
      isRestored,
      lastSaved,
      forceSave,
      pause,
      resume,
      isPaused,
      undo,
      redo,
      canUndo,
      canRedo,
      historyIndex,
      historyLength: history.length,
      withClear,
      reset,
      getPersistedValue,
      isDirty,
      size,
      revert,
    }),
    [
      clear,
      isPersisted,
      isRestored,
      lastSaved,
      forceSave,
      pause,
      resume,
      isPaused,
      undo,
      redo,
      canUndo,
      canRedo,
      historyIndex,
      history.length,
      withClear,
      reset,
      getPersistedValue,
      isDirty,
      size,
      revert,
    ]
  );

  return [state, setState, actions];
}

/**
 * Object-based return type version of useFormPersist
 * Useful for selective destructuring
 *
 * @example
 * ```tsx
 * const { state, setState, clear, undo, redo } = useFormPersistObject('myForm', {
 *   name: '',
 * });
 * ```
 */
export function useFormPersistObject<T extends Record<string, unknown>>(
  key: string,
  initialState: T,
  options: FormPersistOptions<T> = {}
) {
  const [state, setState, actions] = useFormPersist(key, initialState, options);

  return {
    state,
    setState,
    ...actions,
  };
}
