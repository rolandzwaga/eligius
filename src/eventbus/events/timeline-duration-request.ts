/**
 * Request: timeline-duration-request
 * Answered through `eventbus.request('timeline-duration-request')` by
 * EngineEventbusAdapter with the duration of the current timeline. The engine
 * also answers the legacy form, a broadcast whose last argument is a
 * callback that receives the value.
 * @returns The duration in seconds, or undefined when it is not known yet
 * @category Timeline
 */
export interface DurationRequestEvent {
  name: 'timeline-duration-request';
  args: [];
  returns: number | undefined;
}
