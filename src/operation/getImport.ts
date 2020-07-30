import TimelineEventNames from '../timeline-event-names';
import { TOperation } from '../action/types';

export interface IGetImportOperationData {
  systemName: string;
  importedInstance: any;
}

const getImport: TOperation<IGetImportOperationData> = function (operationData, eventBus) {
  const { systemName } = operationData;
  const callBack = (instance: any) => {
    operationData.importedInstance = instance;
  };
  eventBus.broadcast(TimelineEventNames.REQUEST_FUNCTION, [systemName, callBack]);
  delete operationData.systemName;
  return operationData;
};

export default getImport;
