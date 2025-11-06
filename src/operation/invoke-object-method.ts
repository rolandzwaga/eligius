import type {TOperation} from './types.ts';

export interface IInvokeObjectMethodOperationData {
  /**
   *
   * The given object instance
   * @dependency
   *
   */
  instance: any;
  /**
   * The method name on the given object that will be invoked
   * @required
   * @erased
   */
  methodName: string;
  /**
   * Arguments that will be passed to the specified method
   * @erased
   */
  methodArguments?: unknown[];
  /**
   * If any, the results of the method invocation are assigned to the property
   * @output
   */
  methodResult?: unknown;
}

/**
 * This operation invokes the specified method on the given object with the given optional arguments
 * and assigns the result to the `methodResult` operationdata property.
 *
 * @param operationData
 *
 * @category Utility
 */
export const invokeObjectMethod: TOperation<
  IInvokeObjectMethodOperationData,
  Omit<IInvokeObjectMethodOperationData, 'methodName' | 'methodArguments'>
> = (operationData: IInvokeObjectMethodOperationData) => {
  const {methodName, methodArguments, ...newOperationData} = operationData;

  delete (operationData as any).methodName;
  delete (operationData as any).methodArguments;

  const func = operationData.instance[methodName];
  if (typeof func === 'function') {
    newOperationData.methodResult = func.apply(
      operationData.instance,
      methodArguments ?? []
    );
  } else {
    console.error(`The given member name ${methodName} is not a function`);
  }

  return newOperationData;
};
