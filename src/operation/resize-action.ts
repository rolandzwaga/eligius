import { mergeOperationData } from './helper/merge-operation-data.ts';
import type { TOperation, TOperationData } from './types.ts';

export interface IResizeActionOperationData {
  /**
   * @dependency
   */
  actionInstance: any;
  /**
   * @type=ParameterType:object
   */
  actionOperationData: TOperationData;
}

/**
 * @deprecated
 */
export const resizeAction: TOperation<IResizeActionOperationData> = function (
  operationData: IResizeActionOperationData
) {
  const { actionInstance, actionOperationData } = operationData;
  operationData = mergeOperationData(operationData, actionOperationData);

  if ("resize" in actionInstance && typeof actionInstance.resize === "function") {
    return actionInstance.resize(operationData);
  }

  return operationData;
};
