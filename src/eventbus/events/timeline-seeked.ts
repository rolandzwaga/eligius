/**
 * Event: timeline-seeked
 * @param position - The new timeline position after seeking
 * @param duration - The timeline duration
 * @category Timeline
 */
export interface SeekedEvent {
  name: 'timeline-seeked';
  args: [position: number, duration: number];
}
