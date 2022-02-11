import { mergeOperationData } from './helper/merge-operation-data';
import { TOperation } from './types';

export interface IResizeActionOperationData {
  actionInstance: any;
  actionOperationData: any;
}

/**
 * @deprecated
 *
 * @param operationData
 * @returns
 */
export const resizeAction: TOperation<IResizeActionOperationData> = function (
  operationData: IResizeActionOperationData
) {
  const { actionInstance, actionOperationData } = operationData;
  operationData = mergeOperationData(operationData, actionOperationData);

  if (actionInstance.resize) {
    return actionInstance.resize(operationData);
  }

  return operationData;
};
