import type { IAction } from '../action/types.ts';
import { TimelineEventNames } from '../timeline-event-names.ts';
import type { TOperation } from './types.ts';

export interface IRequestActionOperationData {
  /**
   * @type=ParameterType:actionName
   * @required
   */
  systemName: string;
  /**
   * @output
   */
  actionInstance?: IAction;
}

/**
 * This operation requests an action instance with the specified name and assigns it
 * to the `actionInstance` property on the current operation data.
 */
export const requestAction: TOperation<IRequestActionOperationData, Required<IRequestActionOperationData>> = function (
  operationData: IRequestActionOperationData
) {
  const { systemName } = operationData;

  const resultCallback = (action: IAction) => {
    operationData.actionInstance = action;
  };

  this.eventbus.broadcast(TimelineEventNames.REQUEST_ACTION, [
    systemName,
    resultCallback,
  ]);
  return operationData as Required<IRequestActionOperationData>;
};
