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
 *
 * The actions run in order, each receiving the operation data the previous one returned. When an action fails, the
 * remaining actions are skipped and the failure is reported through the eventbus's `reportError` (an error naming
 * this controller, the action and the DOM event, with the original error as `cause`), or logged with
 * `console.error` when the eventbus has no `reportError`.
 */
export class DOMEventListenerController
  implements IController<IDOMEventListenerControllerOperationData>
{
  operationData?: IDOMEventListenerControllerOperationData;
  actionInstanceInfos?: IActionInstanceInfo[];
  name = 'DOMEventListenerController';
  private _boundEventHandler: ((event: any) => void) | null = null;
  /** The eventbus passed to attach(), used to report failing actions */
  private _eventbus: IEventbus | null = null;

  init(operationData: IDOMEventListenerControllerOperationData) {
    this.operationData = {
      selectedElement: operationData.selectedElement,
      eventName: operationData.eventName,
      actions: operationData.actions.slice(),
      actionOperationData: deepCopy(operationData.actionOperationData),
    };
  }

  /**
   * Looks up the configured actions and starts listening for the DOM event.
   *
   * @param eventbus - The eventbus to request the actions from
   * @throws when an action name is unknown (`request-action` throws or
   * returns nothing); the message names the controller, the action and the
   * DOM event, and keeps the responder's "did you mean" hint
   */
  attach(eventbus: IEventbus) {
    if (!this.operationData) {
      return;
    }

    const {selectedElement, actions, eventName} = this.operationData;
    if (!this.actionInstanceInfos) {
      const actionInstanceInfos = actions.map(
        (actionName: string): IActionInstanceInfo => {
          const [isStart, name] = this._isStartAction(actionName);
          let actionInstance: IEndableAction | undefined;
          try {
            actionInstance = eventbus.request<IEndableAction>(
              'request-action',
              name
            );
          } catch (error) {
            const reason =
              error instanceof Error ? error.message : String(error);
            throw new Error(
              `${this.name}: unknown action "${name}" for DOM event "${eventName}". ${reason}`,
              {cause: error}
            );
          }
          if (!actionInstance) {
            throw new Error(
              `${this.name}: unknown action "${name}" for DOM event "${eventName}"`
            );
          }
          return {start: isStart, action: actionInstance};
        }
      );

      this.actionInstanceInfos = actionInstanceInfos;
      this._eventbus = eventbus;
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

    if (event?.target) {
      actionOperationData.eventTarget = event.target;
    }

    // _executeActions never rejects, so the DOM handler leaves no floating
    // rejection behind
    void this._executeActions(
      this.actionInstanceInfos,
      actionOperationData,
      this.operationData.eventName
    );
  }

  /**
   * Runs the actions one after another, merging each action's result into the
   * operation data for the next. A failing action stops the chain, since later
   * actions consume the earlier actions' output, and is reported with an error
   * naming this controller, the action, the phase and the DOM event (see
   * `_reportFailure`). The operation data is never logged.
   */
  private async _executeActions(
    actions: IActionInstanceInfo[],
    operationData: TOperationData,
    eventName: string
  ): Promise<void> {
    for (const {start, action} of actions) {
      try {
        const resultOperationData = start
          ? await action.start(operationData)
          : await action.end(operationData);
        Object.assign(operationData, resultOperationData);
      } catch (error) {
        this._reportFailure(
          `${this.name}: action '${action.name}' (${start ? 'start' : 'end'}) failed for DOM event '${eventName}'`,
          error
        );
        return;
      }
    }
  }

  /**
   * Reports through the eventbus's `reportError` when it has one, so the
   * application's `onHandlerError` sees it; otherwise logs it.
   */
  private _reportFailure(message: string, error: unknown) {
    const eventbus = this._eventbus;
    if (eventbus && typeof eventbus.reportError === 'function') {
      eventbus.reportError(new Error(message, {cause: error}), {
        source: this.name,
      });
      return;
    }
    console.error(message, error);
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
    this._eventbus = null;
    this.actionInstanceInfos = undefined;
  }
}
