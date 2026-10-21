/**
 * Event: request-label-collections
 * @param labelIds - Array of label IDs to retrieve
 * @param callback - Callback that receives the label collections
 * @deprecated Legacy label event; the engine does not handle it. Labels moved to the locale manager in
 * 2.2.0: use `request-translation` (or LabelController with a `translationKey`) instead.
 * @category Engine Request
 */
export interface RequestLabelCollectionsEvent {
  name: 'request-label-collections';
  args: [labelIds: string[], callback: (collections: any) => void];
}
