/**
 * Event: video-complete
 * @param index - The video URL index that completed
 * @category Navigation
 */
export interface VideoCompleteEvent {
  name: 'video-complete';
  args: [index: number];
}
