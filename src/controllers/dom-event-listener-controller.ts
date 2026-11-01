import {
  type IControllerAction,
  requestControllerActions,
  runControllerActions,
} from '@controllers/helper/controller-actions.ts';
import type {IController} from '@controllers/types.ts';
import type {IEventbus} from '@eventbus/types.ts';
import {deepCopy} from '@operation/helper/deep-copy.ts';
import type {TOperationData} from '@operation/types.ts';

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
 * The actions receive a copy of `actionOperationData` plus `eventTarget` (the event's target) and, for key events,
 * `eventKey` (the `KeyboardEvent.key`). They run in order, each receiving the operation data the previous one
 * returned. When an action fails, the
 * remaining actions are skipped and the failure is reported through the eventbus's `reportError` (an error naming
 * this controller, the action and the DOM event, with the original error as `cause`), or logged with
 * `console.error` when the eventbus has no `reportError`.
 */
export class DOMEventListenerController
  implements IController<IDOMEventListenerControllerOperationData>
{
  operationData?: IDOMEventListenerControllerOperationData;
  actionInstanceInfos?: IControllerAction[];
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
      this.actionInstanceInfos = requestControllerActions(
        eventbus,
        actions,
        this.name,
        {kind: 'DOM event', name: eventName}
      );
      this._eventbus = eventbus;
      this._boundEventHandler = this._eventHandler.bind(this);
      selectedElement.on(eventName, this._boundEventHandler);
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
    if (typeof event?.key === 'string') {
      actionOperationData.eventKey = event.key;
    }

    void runControllerActions(
      this.actionInstanceInfos,
      actionOperationData,
      this.name,
      {kind: 'DOM event', name: this.operationData.eventName},
      this._eventbus
    );
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
