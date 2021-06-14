import { IAction } from '../action/types';
import { IEventbus } from '../eventbus/types';
import { TimelineEventNames } from '../timeline-event-names';
import { TOperation } from './types';

export interface IRequestActionOperationData {
  systemName: string;
  actionInstance?: IAction;
}

export const requestAction: TOperation<IRequestActionOperationData> = function(
  operationData: IRequestActionOperationData,
  eventBus: IEventbus
) {
  const { systemName } = operationData;

  const resultCallback = (action: IAction) => {
    operationData.actionInstance = action;
  };

  eventBus.broadcast(TimelineEventNames.REQUEST_ACTION, [
    systemName,
    resultCallback,
  ]);
  return operationData;
};
