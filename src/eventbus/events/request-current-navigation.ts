/**
 * Event: request-current-navigation
 * @param callback - Callback that receives the current navigation data
 * @category Navigation
 */
export interface RequestCurrentNavigationEvent {
  name: 'request-current-navigation';
  args: [callback: (navigation: any) => void];
}
