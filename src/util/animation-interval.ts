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
 * @param ms - Interval length in milliseconds
 * @param signal - Aborting this signal stops the interval
 * @param callback - Receives elapsed milliseconds since start
 */
export function animationInterval(
  ms: number,
  signal: AbortSignal,
  callback: (elapsed: number) => void
) {
  // Prefer currentTime, as it'll better sync animations queued in the
  // same frame, but if it isn't supported, performance.now() is fine.
  const currentTime = document?.timeline?.currentTime;
  const start = currentTime ? Number(currentTime) : performance.now();

  const frame = (time: number) => {
    if (signal.aborted) return;
    callback(time - start);
    scheduleFrame(time);
  };

  const {round} = Math;
  const scheduleFrame = (time: number) => {
    const elapsed = time - start;
    const roundedElapsed = round(elapsed / ms) * ms;
    const targetNext = start + roundedElapsed + ms;
    const delay = targetNext - performance.now();
    setTimeout(() => requestAnimationFrame(frame), delay);
  };

  scheduleFrame(start);
}
