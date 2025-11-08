/**
 * Event: request-label-collection
 * @param language - The language code
 * @param callback - Callback that receives the label collection
 * @category Engine Request
 */
export interface RequestLabelCollectionEvent {
  name: 'request-label-collection';
  args: [language: string, callback: (collection: any) => void];
}
