import { IEndableAction } from '~/action/types';
import { IEventbus } from '~/eventbus/types';
import { deepcopy } from '~/operation/helper/deepcopy';
import { TOperationData } from '~/operation/types';
import { TimelineEventNames } from '~/timeline-event-names';
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
      actionOperationData: operationData.actionOperationData ? deepcopy(operationData.actionOperationData) : undefined,
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

      if (this._getElementTagName(selectedElement) === 'SELECT') {
        selectedElement.on(eventName, this._selectEventHandler.bind(this));
      } else {
        selectedElement.on(eventName, this._eventHandler.bind(this));
      }
    }
  }

  _getElementTagName(element: JQuery | HTMLElement) {
    const tagName = (element as JQuery).length ? (element as JQuery)[0].tagName : (element as HTMLElement).tagName;
    return tagName.toUpperCase();
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

    const copy = this.operationData.actionOperationData ? deepcopy(this.operationData.actionOperationData) : {};

    if (event.target) {
      copy.targetValue = event.target.value;
    }

    this._executeAction(this.actionInstanceInfos, copy, 0);
  }

  _executeAction(actions: IActionInstanceInfo[], operationData: TOperationData, idx: number) {
    if (idx < actions.length) {
      const actionInfo = actions[idx];
      const { action } = actionInfo;
      const method = actionInfo.start ? action.start.bind(action) : action.end.bind(action);
      method(operationData).then((resultOperationData) => {
        return this._executeAction(actions, Object.assign(operationData, resultOperationData), ++idx);
      });
    }
  }

  _selectEventHandler(event: any) {
    if (!this.operationData || !this.actionInstanceInfos) {
      return;
    }

    const options = event.target;

    for (let i = 0, l = options.length; i < l; i++) {
      const opt = options[i];
      if (opt.selected) {
        const copy = this.operationData.actionOperationData ? deepcopy(this.operationData.actionOperationData) : {};
        this._executeAction(this.actionInstanceInfos, Object.assign({ eventArgs: [opt.value] }, copy), 0);
        break;
      }
    }
  }

  detach(_eventbus: IEventbus) {
    this.operationData?.selectedElement.off(this.operationData.eventName);
  }
}
