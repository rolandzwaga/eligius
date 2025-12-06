import type {IAction} from '@action/types.ts';
import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';

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

  operationData.actionInstance = this.eventbus.request<IAction>(
    'request-action',
    systemName
  );

  return operationData as Required<IRequestActionOperationData>;
};
