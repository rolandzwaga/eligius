import { IEventbus } from '../eventbus/types';
import { TimelineEventNames } from '../timeline-event-names';
import { TOperation } from './types';

export interface IGetImportOperationData {
  systemName: string;
  importedInstance: any;
}

export const getImport: TOperation<IGetImportOperationData> = function (
  operationData: IGetImportOperationData,
  eventBus: IEventbus
) {
  const { systemName } = operationData;
  const callBack = (instance: any) => {
    operationData.importedInstance = instance;
  };
  eventBus.broadcast(TimelineEventNames.REQUEST_FUNCTION, [systemName, callBack]);
  delete (operationData as any).systemName;
  return operationData;
};
