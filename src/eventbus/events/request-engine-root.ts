/**
 * Request: request-engine-root
 * Answered through `eventbus.request('request-engine-root')` with the
 * engine's root element (the container selector). From `engine.init()` until
 * `engine.destroy()` every answer is the same jQuery instance. The engine also
 * answers the legacy form, a broadcast whose last argument is a callback that
 * receives the value.
 * @returns The engine root element
 * @category Engine Request
 */
export interface RequestEngineRootEvent {
  name: 'request-engine-root';
  args: [];
  returns: JQuery<HTMLElement>;
}
