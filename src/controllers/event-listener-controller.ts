import { IEndableAction } from '../action/types';
import { IEventbus } from '../eventbus/types';
import { deepCopy } from '../operation/helper/deep-copy';
import { TOperationData } from '../operation/types';
import { TimelineEventNames } from '../timeline-event-names';
import { IController } from './types';

interface IActionInstanceInfo {
  start: boolean;
  action: IEndableAction;
}

export interface IEventListenerControllerOperationData {
  selectedElement: JQuery;
  eventName: string;
  actions: string[];
  actionOperationData?: TOperationData;
}

export class EventListenerController implements IController<IEventListenerControllerOperationData> {
  operationData?: IEventListenerControllerOperationData;
  actionInstanceInfos?: IActionInstanceInfo[];
  name = 'EventListenerController';

  constructor() {}

  init(operationData: IEventListenerControllerOperationData) {
    this.operationData = {
      selectedElement: operationData.selectedElement,
      eventName: operationData.eventName,
      actions: operationData.actions.slice(),
      actionOperationData: operationData.actionOperationData ? deepCopy(operationData.actionOperationData) : undefined,
    };
  }

  attach(eventbus: IEventbus) {
    if (!this.operationData) {
      return;
    }

    const { selectedElement, actions, eventName } = this.operationData;
    if (!this.actionInstanceInfos) {
      this.actionInstanceInfos = [];

      const resultCallback = (isStart: boolean) => (actionInstance: IEndableAction) => {
        this.actionInstanceInfos?.push({ start: isStart, action: actionInstance });
      };

      actions.forEach((actionName: string) => {
        const [isStart, name] = this._isStartAction(actionName);
        eventbus.broadcast(TimelineEventNames.REQUEST_ACTION, [name, resultCallback(isStart)]);
      });

      selectedElement.on(eventName, this._eventHandler.bind(this));
    }
  }

  _isStartAction(actionName: string): [boolean, string] {
    const prefix = actionName.substr(0, 'end:'.length);
    if (prefix === 'end:') {
      return [false, actionName.substr('end:'.length)];
    } else {
      return [true, actionName];
    }
  }

  _eventHandler(event: any) {
    if (!this.operationData || !this.actionInstanceInfos) {
      return;
    }

    const copy = this.operationData.actionOperationData ? deepCopy(this.operationData.actionOperationData) : {};

    if (event.target) {
      copy.targetValue = event.target.value;
    }

    this._executeAction(this.actionInstanceInfos, copy, 0);
  }

  async _executeAction(actions: IActionInstanceInfo[], operationData: TOperationData, idx: number) {
    if (idx < actions.length) {
      const actionInfo = actions[idx];
      const { action } = actionInfo;
      const method = actionInfo.start ? action.start.bind(action) : action.end.bind(action);
      const resultOperationData = await method(operationData);
      this._executeAction(actions, Object.assign(operationData, resultOperationData), ++idx);
    }
  }

  detach(_eventbus: IEventbus) {
    this.operationData?.selectedElement.off(this.operationData.eventName);
  }
}
