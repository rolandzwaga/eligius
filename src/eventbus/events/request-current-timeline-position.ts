/**
 * Request: request-current-timeline-position
 * Answered through `eventbus.request('request-current-timeline-position')` by
 * EngineEventbusAdapter with the position of the current timeline. The engine
 * also answers the legacy form, a broadcast whose last argument is a
 * callback that receives the value.
 * @returns The current position in seconds
 * @category Engine Request
 */
export interface RequestCurrentTimelinePositionEvent {
  name: 'request-current-timeline-position';
  args: [];
  returns: number;
}
