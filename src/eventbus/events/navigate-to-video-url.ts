/**
 * Event: navigate-to-video-url
 * @param index - The video URL index to navigate to
 * @param requestedVideoPosition - Optional video position to seek to
 * @deprecated Legacy video navigation event; the engine does not handle it. Use a navigation entry with
 * `timelineUri` (broadcast as `request-timeline-uri`) and the timeline events instead.
 * @category Navigation
 */
export interface NavigateToVideoUrlEvent {
  name: 'navigate-to-video-url';
  args: [index: number, requestedVideoPosition?: number];
}
