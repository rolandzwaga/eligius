import type {IEndableAction} from '@action/types.ts';
import type {IEventbus} from '@eventbus/types.ts';
import type {TOperationData} from '@operation/types.ts';

/**
 * Helpers shared by the controllers that run configured actions in response
 * to an input (`DOMEventListenerController`, `KeyboardController`).
 */

/**
 * An action to run, and whether its `start` (or `end`) operations run.
 */
export interface IControllerAction {
  start: boolean;
  action: IEndableAction;
}

/**
 * What makes a controller run its actions, used in error messages, such as
 * `{kind: 'DOM event', name: 'click'}`.
 */
export interface IControllerTrigger {
  kind: string;
  name: string;
}

/**
 * Splits off the `end:` prefix of an action name.
 *
 * @returns Whether the `start` operations run, and the action name
 */
function parseActionName(actionName: string): [boolean, string] {
  return actionName.startsWith('end:')
    ? [false, actionName.substring('end:'.length)]
    : [true, actionName];
}

/**
 * Looks up the actions by name. A name prefixed with `end:` runs the `end`
 * operations of the action instead of its `start` operations.
 *
 * @param eventbus - The eventbus to request the actions from
 * @param actionNames - The action names, optionally prefixed with `end:`
 * @param controllerName - The controller, named in error messages
 * @param trigger - What runs the actions, named in error messages
 * @returns The actions in the given order
 * @throws when an action name is unknown (`request-action` throws or
 * returns nothing); the message names the controller, the action and the
 * trigger, and keeps the responder's "did you mean" hint
 */
export function requestControllerActions(
  eventbus: IEventbus,
  actionNames: readonly string[],
  controllerName: string,
  trigger: IControllerTrigger
): IControllerAction[] {
  return actionNames.map(actionName => {
    const [start, name] = parseActionName(actionName);
    const unknown = `${controllerName}: unknown action "${name}" for ${trigger.kind} "${trigger.name}"`;
    let action: IEndableAction | undefined;
    try {
      action = eventbus.request<IEndableAction>('request-action', name);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`${unknown}. ${reason}`, {cause: error});
    }
    if (!action) {
      throw new Error(unknown);
    }
    return {start, action};
  });
}

/**
 * Runs the actions one after another, merging each action's result into the
 * operation data for the next. A failing action stops the chain, since later
 * actions consume the earlier actions' output. The failure is reported
 * through the eventbus's `reportError` (an error naming the controller, the
 * action, the phase and the trigger, with the original error as `cause`), or
 * logged with `console.error` when the eventbus has no `reportError`. The
 * operation data is never logged.
 *
 * Never rejects, so an input handler leaves no floating rejection behind.
 *
 * @param actions - The actions to run
 * @param operationData - The operation data for the first action
 * @param controllerName - The controller, named in error messages
 * @param trigger - What runs the actions, named in error messages
 * @param eventbus - The eventbus to report failures through
 */
export async function runControllerActions(
  actions: readonly IControllerAction[],
  operationData: TOperationData,
  controllerName: string,
  trigger: IControllerTrigger,
  eventbus: IEventbus | null
): Promise<void> {
  for (const {start, action} of actions) {
    try {
      const resultOperationData = start
        ? await action.start(operationData)
        : await action.end(operationData);
      Object.assign(operationData, resultOperationData);
    } catch (error) {
      const message = `${controllerName}: action '${action.name}' (${start ? 'start' : 'end'}) failed for ${trigger.kind} '${trigger.name}'`;
      if (eventbus && typeof eventbus.reportError === 'function') {
        eventbus.reportError(new Error(message, {cause: error}), {
          source: controllerName,
        });
      } else {
        console.error(message, error);
      }
      return;
    }
  }
}
