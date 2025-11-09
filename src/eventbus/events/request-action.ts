/**
 * Event: request-action
 * @param actionName - The name of the action to request
 * @param callback - Callback that receives the action instance
 * @category Engine Request
 */
export interface RequestActionEvent {
  name: 'request-action';
  args: [actionName: string, callback: (actionInstance: any) => void];
}
