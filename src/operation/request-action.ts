import type {IAction} from '@action/types.ts';
import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import {requestNamedEntry} from '@operation/helper/request-registered-entry.ts';
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
 * @throws Error naming requestAction and the `systemName` when no action with that
 * name exists, so the misspelled name is reported here instead of by a later
 * `startAction` or `endAction`.
 *
 * @category Action
 */
export const requestAction: TOperation<
  IRequestActionOperationData,
  Omit<Required<IRequestActionOperationData>, 'systemName'>
> = function (operationData: IRequestActionOperationData) {
  const {systemName} = operationData;

  removeProperties(operationData, 'systemName');

  operationData.actionInstance = requestNamedEntry(
    this.eventbus,
    'request-action',
    'requestAction',
    systemName,
    'action'
  ) as IAction;

  return operationData as Required<IRequestActionOperationData>;
};
