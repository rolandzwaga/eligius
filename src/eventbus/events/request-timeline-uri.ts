/**
 * Event: request-timeline-uri
 * @param uri - The timeline URI to load
 * @param position - Optional start position (defaults to 0)
 * @category Engine Request
 */
export interface RequestTimelineUriEvent {
  name: 'request-timeline-uri';
  args: [uri: string, position?: number];
}
