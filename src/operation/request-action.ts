import type {IAction} from '../action/types.ts';
import {TimelineEventNames} from '../timeline-event-names.ts';
import {removeProperties} from './helper/remove-operation-properties.ts';
import type {TOperation} from './types.ts';

export interface IRequestActionOperationData {
  /**
   * @type=ParameterType:actionName
   * @required
   * @erased
   */
  systemName: string;
  /**
   * @type=ParameterType:object
   * @output
   */
  actionInstance?: IAction;
}

/**
 * This operation requests an action instance with the specified name and assigns it
 * to the `actionInstance` property on the current operation data.
 * 
 * @category Action
 */
export const requestAction: TOperation<
  IRequestActionOperationData,
  Omit<Required<IRequestActionOperationData>, 'systemName'>
> = function (operationData: IRequestActionOperationData) {
  const {systemName} = operationData;

  removeProperties(operationData, 'systemName');

  const resultCallback = (action: IAction) => {
    operationData.actionInstance = action;
  };

  this.eventbus.broadcast(TimelineEventNames.REQUEST_ACTION, [
    systemName,
    resultCallback,
  ]);
  return operationData as Required<IRequestActionOperationData>;
};
