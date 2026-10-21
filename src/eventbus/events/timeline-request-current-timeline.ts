/**
 * Request: timeline-request-current-timeline
 * Answered through `eventbus.request('timeline-request-current-timeline')` by
 * EngineEventbusAdapter with the URI of the current timeline. The engine also
 * answers the legacy form, a broadcast whose last argument is a callback that
 * receives the value.
 * @returns The current timeline URI
 * @category Engine Request
 */
export interface RequestCurrentTimelineEvent {
  name: 'timeline-request-current-timeline';
  args: [];
  returns: string;
}
