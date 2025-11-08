/**
 * Event: timeline-container-request
 * @param callback - Callback that receives the container element
 * @category Timeline
 */
export interface ContainerRequestEvent {
  name: 'timeline-container-request';
  args: [callback: (element: HTMLElement) => void];
}
