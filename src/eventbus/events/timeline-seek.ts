/**
 * Event: timeline-seek
 * @param seekPosition - The position to seek to
 * @param currentPosition - The current position
 * @param duration - The timeline duration
 * @category Timeline
 */
export interface SeekEvent {
  name: 'timeline-seek';
  args: [seekPosition: number, currentPosition: number, duration: number];
}
