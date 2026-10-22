import type {IAction} from '@action/types.ts';
import type {IEventbusListener} from '@eventbus/types.ts';

/**
 * The `IEventbusListener` first registers a number of actions that are then
 * executed when the specified event is broadcast.
 */
export class ActionRegistryEventbusListener implements IEventbusListener {
  private _actionRegistry = new Map<string, IAction[]>();

  registerAction(
    action: IAction,
    eventName: string,
    eventTopic?: string
  ): void {
    if (eventTopic?.length) {
      eventName = `${eventName}:${eventTopic}`;
    }
    if (!this._actionRegistry.has(eventName)) {
      this._actionRegistry.set(eventName, []);
    }
    this._actionRegistry.get(eventName)?.push(action);
  }

  /**
   * Starts every action registered for the event.
   *
   * @returns A promise that settles once all started actions have finished,
   * or undefined when no action is registered. It rejects with the failing
   * action's error, or with an AggregateError when several fail. The Eventbus
   * watches this promise and reports a rejection like any handler error.
   */
  handleEvent(
    eventName: string,
    eventTopic: string | undefined,
    args: any[]
  ): Promise<void> | undefined {
    if (eventTopic) {
      eventName = `${eventName}:${eventTopic}`;
    }
    const actions = this._actionRegistry.get(eventName);
    if (!actions?.length) {
      return undefined;
    }

    // Each action gets its own operation data: Action merges into and
    // mutates the object it is given, so sharing one would leak state
    // (selectedElement, variables, ...) from one action into the next.
    const runs = actions.map(action =>
      action.start({eventArgs: Array.isArray(args) ? [...args] : args})
    );

    return Promise.allSettled(runs).then(results => {
      const errors = results
        .filter(
          (result): result is PromiseRejectedResult =>
            result.status === 'rejected'
        )
        .map(result => result.reason);
      if (errors.length === 1) {
        throw errors[0];
      }
      if (errors.length > 1) {
        throw new AggregateError(
          errors,
          `${errors.length} event actions failed for '${eventName}'`
        );
      }
    });
  }
}
