/**
 * Event: request-engine-root
 * @param callback - Callback that receives the engine root element
 * @category Engine Request
 */
export interface RequestEngineRootEvent {
  name: 'request-engine-root';
  args: [callback: (root: any) => void];
}
