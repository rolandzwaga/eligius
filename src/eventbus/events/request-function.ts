/**
 * Event: request-function
 * @param systemName - The name of the function to request
 * @param callback - Callback that receives the function
 * @category Engine Request
 */
export interface RequestFunctionEvent {
  name: 'request-function';
  args: [systemName: string, callback: (fn: any) => void];
}
