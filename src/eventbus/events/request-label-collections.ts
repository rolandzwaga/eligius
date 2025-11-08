/**
 * Event: request-label-collections
 * @param labelIds - Array of label IDs to retrieve
 * @param callback - Callback that receives the label collections
 * @category Engine Request
 */
export interface RequestLabelCollectionsEvent {
  name: 'request-label-collections';
  args: [labelIds: string[], callback: (collections: any) => void];
}
