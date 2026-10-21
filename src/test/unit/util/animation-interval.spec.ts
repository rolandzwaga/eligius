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
