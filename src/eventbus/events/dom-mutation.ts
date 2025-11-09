/**
 * Event: dom-mutation
 * @param payload - Mutation observer payload
 * @category Controller
 */
export interface DomMutationEvent {
  name: 'dom-mutation';
  args: [payload: any];
}
