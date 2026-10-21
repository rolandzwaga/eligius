import {animationInterval} from '@util/animation-interval.ts';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';

/**
 * animationInterval drives RafPositionSource. Its callback must receive the
 * time elapsed since the interval started, not the absolute RAF timestamp,
 * otherwise a timeline started late in a page's life begins at page uptime.
 */
describe('animationInterval', () => {
  let now = 0;

  beforeEach(() => {
    vi.useFakeTimers();
    now = 50_000; // page has been open for 50 seconds
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((frame: FrameRequestCallback) => {
        frame(now);
        return 1;
      })
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('given page uptime of 50s, when first frame fires after one interval, then callback receives elapsed ms not absolute time', () => {
    const callback = vi.fn();
    const controller = new AbortController();

    animationInterval(1000, controller.signal, callback);
    now += 1000;
    vi.advanceTimersByTime(1000);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(1000);
  });

  test('given running interval, when three intervals pass, then callback receives cumulative elapsed ms', () => {
    const callback = vi.fn();
    const controller = new AbortController();

    animationInterval(1000, controller.signal, callback);
    for (let i = 0; i < 3; i++) {
      now += 1000;
      vi.advanceTimersByTime(1000);
    }

    expect(callback.mock.calls.map(c => c[0])).toEqual([1000, 2000, 3000]);
  });

  test('given aborted signal, when next frame fires, then callback is not called', () => {
    const callback = vi.fn();
    const controller = new AbortController();

    animationInterval(1000, controller.signal, callback);
    controller.abort();
    now += 1000;
    vi.advanceTimersByTime(1000);

    expect(callback).not.toHaveBeenCalled();
  });
});

describe('animationInterval cleanup and resilience', () => {
  let now = 0;

  beforeEach(() => {
    vi.useFakeTimers();
    now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((frame: FrameRequestCallback) => setTimeout(() => frame(now), 0))
    );
    vi.stubGlobal(
      'cancelAnimationFrame',
      vi.fn((id: number) => clearTimeout(id))
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('given a running interval, when the signal is aborted, then no timer or animation frame remains', () => {
    const controller = new AbortController();
    animationInterval(1000, controller.signal, vi.fn());

    expect(vi.getTimerCount()).toBe(1);
    controller.abort();

    expect(vi.getTimerCount()).toBe(0);
  });

  test('given an animation frame already requested, when the signal is aborted, then the frame is cancelled', () => {
    const controller = new AbortController();
    const callback = vi.fn();
    animationInterval(1000, controller.signal, callback);
    // Fire the timer, which requests the frame, but not the frame itself
    vi.advanceTimersToNextTimer();
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);

    controller.abort();

    expect(cancelAnimationFrame).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    expect(callback).not.toHaveBeenCalled();
  });

  test('given an already aborted signal, when the interval is started, then nothing is scheduled', () => {
    const controller = new AbortController();
    controller.abort();

    animationInterval(1000, controller.signal, vi.fn());

    expect(vi.getTimerCount()).toBe(0);
  });

  test('given a callback that throws, when the next interval passes, then the interval keeps running', () => {
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((frame: FrameRequestCallback) => {
        frame(now);
        return 1;
      })
    );
    const controller = new AbortController();
    const elapsed: number[] = [];
    const callback = vi.fn((value: number) => {
      elapsed.push(value);
      if (value === 1000) {
        throw new Error('consumer failure');
      }
    });
    animationInterval(1000, controller.signal, callback);

    now = 1000;
    try {
      vi.advanceTimersByTime(1000);
    } catch {
      // The callback's error may surface through the fake timer
    }
    now = 2000;
    vi.advanceTimersByTime(1000);

    expect(elapsed).toEqual([1000, 2000]);
    controller.abort();
  });
});
