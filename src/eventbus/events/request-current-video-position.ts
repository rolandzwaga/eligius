/**
 * Event: request-current-video-position
 * @param callback - Callback that receives the current video position
 * @category Navigation
 */
export interface RequestCurrentVideoPositionEvent {
  name: 'request-current-video-position';
  args: [callback: (position: number) => void];
}
