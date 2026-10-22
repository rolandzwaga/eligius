/**
 * Event: request-label-collection
 * @param language - The language code
 * @param callback - Callback that receives the label collection
 * @deprecated Legacy label event; the engine does not handle it. Labels moved to the locale manager in
 * 2.2.0: use `request-translation` (or LabelController with a `translationKey`) instead.
 * @category Engine Request
 */
export interface RequestLabelCollectionEvent {
  name: 'request-label-collection';
  args: [language: string, callback: (collection: any) => void];
}
