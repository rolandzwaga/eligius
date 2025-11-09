/**
 * Event: request-instance
 * @param instanceName - The name of the instance to request
 * @param callback - Callback that receives the instance
 * @category Engine Request
 */
export interface RequestInstanceEvent {
  name: 'request-instance';
  args: [instanceName: string, callback: (instance: any) => void];
}
