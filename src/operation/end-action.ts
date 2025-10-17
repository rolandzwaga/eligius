import type { IEndableAction } from '../action/types.ts';
import { internalResolve } from './helper/internal-resolve.ts';
import { mergeOperationData } from './helper/merge-operation-data.ts';
import type { TOperation } from './types.ts';

export interface IEndActionOperationData {
  /**
   * @dependency
   */
  actionInstance: IEndableAction;
  /**
   * @required
   * @erased
   */
  actionOperationData: Record<string, unknown>;
}

/**
 * This operation invokes the {@link EndableAction}.end method on the specified action instance.
 *
 * The action operation data is first merged with the current operation data before it is
 * passed on to the action. After the action has completed the action operation data properties
 * are removed from the current operation data.
 */
export const endAction: TOperation<IEndActionOperationData> = (
  operationData: IEndActionOperationData
) => {
  let { actionOperationData, ...newOperationData } = operationData;

  return new Promise<IEndActionOperationData>((resolve, reject) => {
    newOperationData = mergeOperationData(
      newOperationData,
      actionOperationData
    );

    newOperationData.actionInstance.end(newOperationData).then(() => {
      const sanitizedData = Object.keys(newOperationData)
        .filter(key => !(key in actionOperationData))
        .reduce((acc, key) => {
          (acc as any)[key] = (newOperationData as any)[key];
          return acc;
        }, {} as typeof newOperationData);
      internalResolve(resolve, sanitizedData);
    }, reject);
  });
};
