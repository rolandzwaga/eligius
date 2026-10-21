// https://gist.github.com/jakearchibald/cb03f15670817001b1157e62a076fe95
/**
 * Calls `callback` roughly every `ms` milliseconds, aligned to animation
 * frames, until `signal` is aborted.
 *
 * The callback receives the time elapsed in milliseconds since this interval
 * was started, not the absolute animation frame timestamp. Consumers can
 * therefore treat the value as "time since start" regardless of how long the
 * page has been open.
 *
 * Frames are scheduled on the grid `start + k * ms`. A frame's timestamp can
 * land a little before or after its grid point (timer truncation, frame begin
 * time, scheduling latency), so the scheduler treats a frame as belonging to
 * the nearest grid point: `Math.round(elapsed / ms)`. Consumers that convert
 * elapsed time into a tick count must use the same rounding, otherwise a
 * slightly early frame is counted as the previous tick and the scheduler
 * skips ahead past the one that was never reported.
 *
 * Aborting the signal cancels the pending timer and animation frame at once,
 * so nothing keeps running after the owner is destroyed. A callback that
 * throws does not stop the interval: the next frame is still scheduled and
 * the error is rethrown to the frame's caller.
 *
 * @param ms - Interval length in milliseconds
 * @param signal - Aborting this signal stops the interval
 * @param callback - Receives elapsed milliseconds since start
 */
export function animationInterval(
  ms: number,
  signal: AbortSignal,
  callback: (elapsed: number) => void
): void {
  if (signal.aborted) {
    return;
  }

  // Prefer currentTime, as it'll better sync animations queued in the
  // same frame, but if it isn't supported, performance.now() is fine.
  const currentTime = document?.timeline?.currentTime;
  const start = currentTime ? Number(currentTime) : performance.now();

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let frameId: number | undefined;

  const frame = (time: number) => {
    if (signal.aborted) return;
    try {
      callback(time - start);
    } finally {
      scheduleFrame(time);
    }
  };

  const scheduleFrame = (time: number) => {
    if (signal.aborted) return;
    const elapsed = time - start;
    const roundedElapsed = Math.round(elapsed / ms) * ms;
    const targetNext = start + roundedElapsed + ms;
    const delay = targetNext - performance.now();
    timeoutId = setTimeout(() => {
      timeoutId = undefined;
      if (signal.aborted) return;
      let ran = false;
      const id = requestAnimationFrame(time => {
        ran = true;
        frameId = undefined;
        frame(time);
      });
      // A frame that already ran synchronously has nothing left to cancel
      if (!ran) {
        frameId = id;
      }
    }, delay);
  };

  signal.addEventListener(
    'abort',
    () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      if (frameId !== undefined) {
        if (typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(frameId);
        }
        frameId = undefined;
      }
    },
    {once: true}
  );

  scheduleFrame(start);
}
