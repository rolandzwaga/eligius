/**
 * Event: timeline-seek-request
 * @param position - The timeline position to seek to
 * @category Timeline
 */
export interface SeekRequestEvent {
  name: 'timeline-seek-request';
  args: [position: number];
}
