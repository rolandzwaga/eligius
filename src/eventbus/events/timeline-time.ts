/**
 * Event: timeline-time
 * @param position - The current timeline position
 * @category Timeline
 */
export interface TimeEvent {
  name: 'timeline-time';
  args: [position: number];
}
