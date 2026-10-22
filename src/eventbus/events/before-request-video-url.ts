/**
 * Event: before-request-video-url
 * @param index - The video URL index
 * @param requestedVideoPosition - Optional video position to seek to
 * @param isHistoryRequest - Flag indicating if this is a history request
 * @deprecated Legacy video navigation event; the engine does not handle it. Use a navigation entry with
 * `timelineUri` (broadcast as `request-timeline-uri`) and the timeline events instead.
 * @category Navigation
 */
export interface BeforeRequestVideoUrlEvent {
  name: 'before-request-video-url';
  args: [
    index: number,
    requestedVideoPosition?: number,
    isHistoryRequest?: boolean,
  ];
}
