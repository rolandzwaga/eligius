/**
 * Event: push-history-state
 * @param state - The history state to push
 * @category Navigation
 */
export interface PushHistoryStateEvent {
  name: 'push-history-state';
  args: [state: any];
}
