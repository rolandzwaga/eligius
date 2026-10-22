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
   * @type=ParameterType:object
   * @erased
   */
  actionOperationData?: Record<string, unknown>;
}

/**
 * This operation invokes the {@link EndableAction}.end method on the specified action instance.
 *
 * The action receives its own copy of the current operation data merged with the action
 * operation data. Whatever the action's end operations add, change or remove in that copy stays
 * with the action: once it has completed, this operation continues with the operation data it
 * had before, without the `actionOperationData` property.
 *
 * @category Action
 */
export const endAction: TOperation<
  IEndActionOperationData,
  Omit<IEndActionOperationData, 'actionOperationData'>
> = (operationData: IEndActionOperationData) => {
  const {actionOperationData = {}, ...callerOperationData} = operationData;

  return new Promise<Omit<IEndActionOperationData, 'actionOperationData'>>(
    (resolve, reject) => {
      const {actionInstance} = callerOperationData;
      if (!actionInstance) {
        reject(new Error('endAction: actionInstance is required'));
        return;
      }

      // The catch also rejects on errors thrown by the fulfilment handler, so the
      // returned promise always settles.
      actionInstance
        .end(mergeOperationData(callerOperationData, actionOperationData))
        .then(() => {
          internalResolve(resolve, {...callerOperationData});
        })
        .catch(reject);
    }
  );
};
