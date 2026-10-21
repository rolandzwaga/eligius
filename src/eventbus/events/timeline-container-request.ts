/**
 * Request: timeline-container-request
 * Answered through `eventbus.request('timeline-container-request')` by
 * EngineEventbusAdapter with the DOM container of the current timeline. The
 * engine also answers the legacy form, a broadcast whose last argument is a
 * callback that receives the value.
 * @returns The container element, or undefined when there is none
 * @category Timeline
 */
export interface ContainerRequestEvent {
  name: 'timeline-container-request';
  args: [];
  returns: JQuery<HTMLElement> | undefined;
}
