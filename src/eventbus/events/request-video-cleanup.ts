/**
 * Event: request-video-cleanup
 * @deprecated Legacy video navigation event; the engine does not handle it. Use a navigation entry with
 * `timelineUri` (broadcast as `request-timeline-uri`) and the timeline events instead.
 * @category Navigation
 */
export interface RequestVideoCleanupEvent {
  name: 'request-video-cleanup';
  args: [];
}
