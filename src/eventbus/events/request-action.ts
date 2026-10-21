import type {IAction} from '@action/types.ts';

/**
 * Request: request-action
 * Answered through `eventbus.request('request-action', actionName)` by
 * EngineFactory with the configured action of that name. Throws for an
 * unknown name, with a "did you mean" hint.
 * @param actionName - The name of the action to request
 * @returns The action
 * @category Engine Request
 */
export interface RequestActionEvent {
  name: 'request-action';
  args: [actionName: string];
  returns: IAction;
}
