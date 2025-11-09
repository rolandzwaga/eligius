/**
 * Event: timeline-duration
 * @param getDuration - Function that returns the timeline duration
 * @category Timeline
 */
export interface DurationEvent {
  name: 'timeline-duration';
  args: [getDuration: (() => number) | undefined];
}
