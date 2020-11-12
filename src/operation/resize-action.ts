import { IEventbus } from '~/eventbus/types';
import { mergeOperationData } from './helper/merge-operation-data';
import { TOperation } from './types';

export interface IResizeActionOperationData {
  actionInstance: any;
  actionOperationData: any;
}

export const resizeAction: TOperation<IResizeActionOperationData> = function (
  operationData: IResizeActionOperationData,
  _eventBus: IEventbus
) {
  const { actionInstance, actionOperationData } = operationData;
  operationData = mergeOperationData(operationData, actionOperationData);

  if (actionInstance.resize) {
    return actionInstance.resize(operationData);
  }

  return operationData;
};
