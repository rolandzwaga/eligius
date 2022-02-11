import { IAction } from '../action/types';
import { TimelineEventNames } from '../timeline-event-names';
import { TOperation } from './types';

export interface IRequestActionOperationData {
  systemName: string;
  actionInstance?: IAction;
}

/**
 * This operation requests an action instance with the specified name and assigns it
 * to the actionInstance property on the current operation data.
 *
 * @param operationData
 * @returns
 */
export const requestAction: TOperation<IRequestActionOperationData> = function (
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
  return operationData;
};
