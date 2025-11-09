/**
 * Event: timeline-duration-request
 * @param callback - Callback that receives the duration
 * @category Timeline
 */
export interface DurationRequestEvent {
  name: 'timeline-duration-request';
  args: [callback: (duration: number) => void];
}
