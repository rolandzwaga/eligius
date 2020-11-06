import TimelineEventNames from '../timeline-event-names';
import { TOperation } from '../action/types';

export interface IRequestActionOperationData {
  systemName: string;
  actionInstance: any;
}

const requestAction: TOperation<IRequestActionOperationData> = function (operationData, eventBus) {
  const { systemName } = operationData;

  const resultCallback = (action: any) => {
    operationData.actionInstance = action;
  };
  eventBus.broadcast(TimelineEventNames.REQUEST_ACTION, [systemName, resultCallback]);
  return operationData;
};

export default requestAction;
