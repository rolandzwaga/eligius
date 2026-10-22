/**
 * Event: request-video-url
 * @param videoUrlIndex - The index of the video URL
 * @param requestedVideoPosition - Optional video position to seek to
 * @param fromRouting - Optional flag indicating if request came from routing
 * @deprecated Legacy video navigation event; the engine does not handle it. Use a navigation entry with
 * `timelineUri` (broadcast as `request-timeline-uri`) and the timeline events instead.
 * @category Navigation
 */
export interface RequestVideoUrlEvent {
  name: 'request-video-url';
  args: [
    videoUrlIndex: number,
    requestedVideoPosition?: number,
    fromRouting?: boolean,
  ];
}
