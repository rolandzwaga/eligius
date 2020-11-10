import { IAction } from '../action/types';
import { IEventbusListener } from './types';

export class ActionRegistryEventbusListener implements IEventbusListener {
  #actionRegistry: Record<string, IAction[]> = {};

  registerAction(action: IAction, eventName: string, eventTopic?: string): void {
    if (eventTopic && eventTopic.length) {
      eventName = `${eventName}:${eventTopic}`;
    }
    if (!this.#actionRegistry[eventName]) {
      this.#actionRegistry[eventName] = [];
    }
    this.#actionRegistry[eventName].push(action);
  }

  handleEvent(eventName: string, eventTopic: string | undefined, args: any[]): void {
    if (eventTopic && eventTopic.length) {
      eventName = `${eventName}:${eventTopic}`;
    }
    const actions = this.#actionRegistry[eventName];
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
