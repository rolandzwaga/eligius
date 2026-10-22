/**
 * Event: video-complete
 * @param index - The video URL index that completed
 * @deprecated Legacy video navigation event; the engine does not handle it. Use a navigation entry with
 * `timelineUri` (broadcast as `request-timeline-uri`) and the timeline events instead.
 * @category Navigation
 */
export interface VideoCompleteEvent {
  name: 'video-complete';
  args: [index: number];
}
