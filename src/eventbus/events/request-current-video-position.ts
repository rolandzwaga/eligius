/**
 * Event: request-current-video-position
 * @param callback - Callback that receives the current video position
 * @deprecated Legacy video navigation event; the engine does not handle it. Use a navigation entry with
 * `timelineUri` (broadcast as `request-timeline-uri`) and the timeline events instead.
 * @category Navigation
 */
export interface RequestCurrentVideoPositionEvent {
  name: 'request-current-video-position';
  args: [callback: (position: number) => void];
}
