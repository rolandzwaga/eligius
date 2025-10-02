// https://gist.github.com/jakearchibald/cb03f15670817001b1157e62a076fe95
export function animationInterval(
  ms: number,
  signal: AbortSignal,
  callback: (time: number) => void
) {
  // Prefer currentTime, as it'll better sync animations queued in the
  // same frame, but if it isn't supported, performance.now() is fine.
  const currentTime = document?.timeline?.currentTime;
  const start = currentTime ? Number(currentTime) : performance.now();

  const frame = (time: number) => {
    if (signal.aborted) return;
    callback(time);
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
