/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @license MIT
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Debounce and throttle utilities for controlling save frequency
 */

/**
 * Creates a debounced function that delays invoking the callback
 * until after the specified wait time has elapsed since the last call.
 *
 * @param callback - The function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Object with debounced function, cancel, and flush methods
 *
 * @example
 * ```typescript
 * const { debounced, cancel, flush } = createDebouncedFn(
 *   (value) => saveToStorage(value),
 *   500
 * );
 *
 * // Call multiple times, only last call executes after 500ms
 * debounced('a');
 * debounced('b');
 * debounced('c'); // This one executes
 *
 * // Force immediate execution
 * flush();
 *
 * // Cancel pending execution
 * cancel();
 * ```
 */
export function createDebouncedFn<T extends (...args: Parameters<T>) => void>(
  callback: T,
  wait: number
): {
  debounced: (...args: Parameters<T>) => void;
  cancel: () => void;
  flush: () => void;
  pending: () => boolean;
} {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  const flush = (): void => {
    if (timeoutId !== null && lastArgs !== null) {
      const argsToUse = lastArgs;
      cancel();
      callback(...argsToUse);
    }
  };

  const pending = (): boolean => {
    return timeoutId !== null;
  };

  const debounced = (...args: Parameters<T>): void => {
    lastArgs = args;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (lastArgs !== null) {
        const argsToUse = lastArgs;
        lastArgs = null;
        callback(...argsToUse);
      }
    }, wait);
  };

  return { debounced, cancel, flush, pending };
}

/**
 * Creates a throttled function that only invokes the callback
 * at most once per specified interval.
 *
 * @param callback - The function to throttle
 * @param interval - Minimum interval between calls in milliseconds
 * @returns Object with throttled function and cancel method
 *
 * @example
 * ```typescript
 * const { throttled, cancel } = createThrottledFn(
 *   (value) => saveToStorage(value),
 *   1000
 * );
 *
 * // First call executes immediately
 * throttled('a');
 *
 * // These are ignored (within 1000ms)
 * throttled('b');
 * throttled('c');
 *
 * // After 1000ms, next call will execute
 * ```
 */
export function createThrottledFn<T extends (...args: Parameters<T>) => void>(
  callback: T,
  interval: number
): {
  throttled: (...args: Parameters<T>) => void;
  cancel: () => void;
} {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  const throttled = (...args: Parameters<T>): void => {
    const now = Date.now();
    const remaining = interval - (now - lastCall);

    lastArgs = args;

    if (remaining <= 0) {
      // Enough time has passed, execute immediately
      /* istanbul ignore if -- @preserve Cleanup edge case */
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      callback(...args);
    } else if (timeoutId === null) {
      // Schedule trailing call
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        if (lastArgs !== null) {
          callback(...lastArgs);
          lastArgs = null;
        }
      }, remaining);
    }
  };

  return { throttled, cancel };
}

/**
 * Combines debounce and throttle for optimal save behavior.
 * Debounces rapid changes but ensures a save happens at least every throttle interval.
 *
 * @param callback - The function to control
 * @param debounceWait - Debounce wait time in milliseconds
 * @param throttleInterval - Optional throttle interval in milliseconds
 * @returns Combined control object
 *
 * @example
 * ```typescript
 * const saveControl = createSaveController(
 *   (value) => saveToStorage(value),
 *   500,  // Debounce 500ms
 *   5000  // But save at least every 5 seconds
 * );
 *
 * // Rapid typing: debounced
 * // Long continuous typing: throttled every 5 seconds
 * saveControl.save(formData);
 * ```
 */
export function createSaveController<T extends (...args: Parameters<T>) => void>(
  callback: T,
  debounceWait: number,
  throttleInterval?: number
): {
  save: (...args: Parameters<T>) => void;
  cancel: () => void;
  flush: () => void;
  pending: () => boolean;
} {
  const debounce = createDebouncedFn(callback, debounceWait);

  if (!throttleInterval) {
    return {
      save: debounce.debounced,
      cancel: debounce.cancel,
      flush: debounce.flush,
      pending: debounce.pending,
    };
  }

  const throttle = createThrottledFn(callback, throttleInterval);

  return {
    save: (...args: Parameters<T>) => {
      debounce.debounced(...args);
      throttle.throttled(...args);
    },
    cancel: () => {
      debounce.cancel();
      throttle.cancel();
    },
    flush: debounce.flush,
    pending: debounce.pending,
  };
}
