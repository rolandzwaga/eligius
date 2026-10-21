import type {IEndableAction} from '@action/types.ts';
import type {IController} from '@controllers/types.ts';
import type {IEventbus} from '@eventbus/types.ts';
import {deepCopy} from '@operation/helper/deep-copy.ts';
import type {TOperationData} from '@operation/types.ts';

interface IActionInstanceInfo {
  start: boolean;
  action: IEndableAction;
}

export interface IDOMEventListenerControllerOperationData {
  /**
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @type=ParameterType:eventName
   * @required
   */
  eventName: string;
  actions: string[];
  /**
   * @type=ParameterType:object
   */
  actionOperationData?: TOperationData;
}

/**
 * This controller attaches to the given selected element and adds a DOM event listener for the specified event name that
 * executes the given actions with the given operation data.
 *
 * By default the `start` operations of the specified actions are executed. To execute the `end` operations instead,
 * prefix the action name with `end:`.
 */
export class DOMEventListenerController
  implements IController<IDOMEventListenerControllerOperationData>
{
  operationData?: IDOMEventListenerControllerOperationData;
  actionInstanceInfos?: IActionInstanceInfo[];
  name = 'DOMEventListenerController';
  private _boundEventHandler: ((event: any) => void) | null = null;

  init(operationData: IDOMEventListenerControllerOperationData) {
    this.operationData = {
      selectedElement: operationData.selectedElement,
      eventName: operationData.eventName,
      actions: operationData.actions.slice(),
      actionOperationData: deepCopy(operationData.actionOperationData),
    };
  }

  attach(eventbus: IEventbus) {
    if (!this.operationData) {
      return;
    }

    const {selectedElement, actions, eventName} = this.operationData;
    if (!this.actionInstanceInfos) {
      this.actionInstanceInfos = [];

      actions.forEach((actionName: string) => {
        const [isStart, name] = this._isStartAction(actionName);
        const actionInstance = eventbus.request<IEndableAction>(
          'request-action',
          name
        );
        if (actionInstance) {
          this.actionInstanceInfos?.push({
            start: isStart,
            action: actionInstance,
          });
        }
      });

      this._boundEventHandler = this._eventHandler.bind(this);
      selectedElement.on(eventName, this._boundEventHandler);
    }
  }

  private _isStartAction(actionName: string): [boolean, string] {
    const prefix = actionName.substring(0, 'end:'.length);
    if (prefix === 'end:') {
      return [false, actionName.substring('end:'.length)];
    } else {
      return [true, actionName];
    }
  }

  private _eventHandler(event: any) {
    if (!this.operationData || !this.actionInstanceInfos) {
      return;
    }

    const actionOperationData = this.operationData.actionOperationData
      ? deepCopy(this.operationData.actionOperationData)
      : {};

    if (event.target) {
      actionOperationData.eventTarget = event.target;
    }

    this._executeAction(this.actionInstanceInfos, actionOperationData, 0);
  }

  private async _executeAction(
    actions: IActionInstanceInfo[],
    operationData: TOperationData,
    idx: number
  ) {
    if (idx < actions.length) {
      const actionInfo = actions[idx];
      const {action} = actionInfo;
      const method = actionInfo.start
        ? action.start.bind(action)
        : action.end.bind(action);
      const resultOperationData = await method(operationData);
      this._executeAction(
        actions,
        Object.assign(operationData, resultOperationData),
        ++idx
      );
    }
  }

  /**
   * Removes only the handler this controller registered, so other handlers for
   * the same event on the element keep working, and resets the action
   * instances so a later attach registers again.
   */
  detach(_eventbus: IEventbus) {
    if (this.operationData && this._boundEventHandler) {
      this.operationData.selectedElement.off(
        this.operationData.eventName,
        this._boundEventHandler
      );
    }
    this._boundEventHandler = null;
    this.actionInstanceInfos = undefined;
  }
}
