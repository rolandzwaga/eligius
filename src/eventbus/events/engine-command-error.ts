/**
 * Event: engine-command-error
 * Broadcast by EngineEventbusAdapter when an engine command that an eventbus
 * event triggered fails, for example `engine.start()` after a
 * `timeline-play-request` when the browser blocks autoplay. The failure is
 * also logged with `console.error`.
 * @param command - The engine method that failed: `'start'`, `'stop'`, `'seek'` or `'switchTimeline'`
 * @param error - The value the engine's promise rejected with
 * @category Engine
 */
export interface EngineCommandErrorEvent {
  name: 'engine-command-error';
  args: [command: string, error: unknown];
}
