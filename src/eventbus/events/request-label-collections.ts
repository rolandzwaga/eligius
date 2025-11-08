/**
 * Event: request-label-collections
 * @param callback - Callback that receives all label collections
 * @category Engine Request
 */
export interface RequestLabelCollectionsEvent {
  name: 'request-label-collections';
  args: [callback: (collections: any) => void];
}
