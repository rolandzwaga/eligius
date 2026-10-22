/**
 * Event: before-request-timeline-uri
 *
 * Broadcast by `RequestVideoUriInterceptor` just before a
 * `request-timeline-uri` event is handled, with the same arguments.
 *
 * @param uri - The timeline URI that is about to be loaded
 * @param position - Optional start position (defaults to 0)
 * @category Timeline
 */
export interface BeforeRequestTimelineUriEvent {
  name: 'before-request-timeline-uri';
  args: [uri: string, position?: number];
}
