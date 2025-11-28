/**
 * react-form-autosave
 * @version 0.1.2
 * @author 686f6c61
 * @repository https://github.com/686f6c61/react-form-autosave
 *
 * Tests for middleware/debounce.ts
 */

import {
  createDebouncedFn,
  createThrottledFn,
  createSaveController,
} from '../middleware/debounce';

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('createDebouncedFn', () => {
    it('should debounce function calls', () => {
      const callback = jest.fn();
      const { debounced } = createDebouncedFn(callback, 100);

      debounced('a');
      debounced('b');
      debounced('c');

      expect(callback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('c');
    });

    it('should cancel pending calls', () => {
      const callback = jest.fn();
      const { debounced, cancel } = createDebouncedFn(callback, 100);

      debounced('test');
      cancel();

      jest.advanceTimersByTime(100);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should flush pending calls immediately', () => {
      const callback = jest.fn();
      const { debounced, flush } = createDebouncedFn(callback, 100);

      debounced('test');
      flush();

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('test');
    });

    it('should not flush if no pending calls', () => {
      const callback = jest.fn();
      const { flush } = createDebouncedFn(callback, 100);

      flush();

      expect(callback).not.toHaveBeenCalled();
    });

    it('should report pending status correctly', () => {
      const callback = jest.fn();
      const { debounced, pending, cancel } = createDebouncedFn(callback, 100);

      expect(pending()).toBe(false);

      debounced('test');
      expect(pending()).toBe(true);

      cancel();
      expect(pending()).toBe(false);
    });

    it('should clear lastArgs after execution', () => {
      const callback = jest.fn();
      const { debounced, flush } = createDebouncedFn(callback, 100);

      debounced('test');
      jest.advanceTimersByTime(100);

      // Second flush should not call callback again
      flush();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple arguments', () => {
      const callback = jest.fn();
      const { debounced } = createDebouncedFn(callback, 100);

      debounced('a', 'b', 'c');
      jest.advanceTimersByTime(100);

      expect(callback).toHaveBeenCalledWith('a', 'b', 'c');
    });

    it('should reset timer on each call', () => {
      const callback = jest.fn();
      const { debounced } = createDebouncedFn(callback, 100);

      debounced('first');
      jest.advanceTimersByTime(50);

      debounced('second');
      jest.advanceTimersByTime(50);

      expect(callback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('second');
    });
  });

  describe('createThrottledFn', () => {
    it('should execute first call immediately', () => {
      const callback = jest.fn();
      const { throttled } = createThrottledFn(callback, 100);

      throttled('test');

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('test');
    });

    it('should throttle subsequent calls', () => {
      const callback = jest.fn();
      const { throttled } = createThrottledFn(callback, 100);

      throttled('first');
      throttled('second');
      throttled('third');

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('first');

      jest.advanceTimersByTime(100);

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenCalledWith('third');
    });

    it('should allow calls after interval passes', () => {
      const callback = jest.fn();
      const { throttled } = createThrottledFn(callback, 100);

      throttled('first');
      jest.advanceTimersByTime(100);

      throttled('second');

      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should cancel pending throttled calls', () => {
      const callback = jest.fn();
      const { throttled, cancel } = createThrottledFn(callback, 100);

      throttled('first');
      throttled('second');

      cancel();

      jest.advanceTimersByTime(100);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('first');
    });

    it('should schedule trailing call', () => {
      const callback = jest.fn();
      const { throttled } = createThrottledFn(callback, 100);

      throttled('first');
      jest.advanceTimersByTime(50);
      throttled('second');

      expect(callback).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(50);

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith('second');
    });
  });

  describe('createSaveController', () => {
    it('should use debounce only when no throttle interval', () => {
      const callback = jest.fn();
      const controller = createSaveController(callback, 100);

      controller.save('test');

      expect(callback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should combine debounce and throttle when both provided', () => {
      const callback = jest.fn();
      const controller = createSaveController(callback, 100, 500);

      controller.save('first');

      // First throttle call executes immediately
      expect(callback).toHaveBeenCalledTimes(1);

      controller.save('second');
      controller.save('third');

      // Debounce not yet fired
      expect(callback).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);

      // Debounce fires
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should cancel both debounce and throttle', () => {
      const callback = jest.fn();
      const controller = createSaveController(callback, 100, 500);

      controller.save('test');
      controller.cancel();

      jest.advanceTimersByTime(500);

      // Only the initial throttle call should have executed
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should flush pending saves', () => {
      const callback = jest.fn();
      const controller = createSaveController(callback, 100);

      controller.save('test');
      controller.flush();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should report pending status', () => {
      const callback = jest.fn();
      const controller = createSaveController(callback, 100);

      expect(controller.pending()).toBe(false);

      controller.save('test');

      expect(controller.pending()).toBe(true);

      jest.advanceTimersByTime(100);

      expect(controller.pending()).toBe(false);
    });
  });
});
