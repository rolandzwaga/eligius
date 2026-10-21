import type {IEndableAction} from '@action/types.ts';
import {internalResolve} from '@operation/helper/internal-resolve.ts';
import {mergeOperationData} from '@operation/helper/merge-operation-data.ts';
import type {TOperation} from '@operation/types.ts';

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
 *
 * @category Action
 */
export const endAction: TOperation<
  IEndActionOperationData,
  Omit<IEndActionOperationData, 'actionOperationData'>
> = (operationData: IEndActionOperationData) => {
  let {actionOperationData = {}, ...newOperationData} = operationData;

  return new Promise<IEndActionOperationData>((resolve, reject) => {
    if (!newOperationData.actionInstance) {
      reject(new Error('endAction: actionInstance is required'));
      return;
    }

    newOperationData = mergeOperationData(
      newOperationData,
      actionOperationData
    );

    // The catch also rejects on errors thrown by the fulfilment handler, so the
    // returned promise always settles.
    newOperationData.actionInstance
      .end(newOperationData)
      .then(() => {
        const sanitizedData = Object.keys(newOperationData)
          .filter(key => !Object.hasOwn(actionOperationData, key))
          .reduce(
            (acc, key) => {
              (acc as any)[key] = (newOperationData as any)[key];
              return acc;
            },
            {} as typeof newOperationData
          );
        internalResolve(resolve, sanitizedData);
      })
      .catch(reject);
  });
};
