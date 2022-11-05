import { IAction } from '../action/types';
import { IEventbusListener } from './types';

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
    if (eventTopic && eventTopic.length) {
      eventName = `${eventName}:${eventTopic}`;
    }
    if (!this._actionRegistry.has(eventName)) {
      this._actionRegistry.set(eventName, []);
    }
    this._actionRegistry.get(eventName)?.push(action);
  }

  handleEvent(
    eventName: string,
    eventTopic: string | undefined,
    args: any[]
  ): void {
    if (eventTopic) {
      eventName = `${eventName}:${eventTopic}`;
    }
    const actions = this._actionRegistry.get(eventName);
    if (actions) {
      const operationData = {
        eventArgs: args,
      };
      actions.forEach((action) => {
        action.start(operationData);
      });
    }
  }
}
