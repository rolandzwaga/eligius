/**
 * Event: navigate-to-video-url
 * @param index - The video URL index to navigate to
 * @param requestedVideoPosition - Optional video position to seek to
 * @category Navigation
 */
export interface NavigateToVideoUrlEvent {
  name: 'navigate-to-video-url';
  args: [index: number, requestedVideoPosition?: number];
}
