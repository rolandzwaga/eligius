/**
 * Event: before-request-video-url
 * @param index - The video URL index
 * @param requestedVideoPosition - Optional video position to seek to
 * @param isHistoryRequest - Flag indicating if this is a history request
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
