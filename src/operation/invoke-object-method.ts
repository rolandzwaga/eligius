import type { TOperation } from './types.ts';

export interface IInvokeObjectMethodOperationData {
  /**
   *  The given object instance
   * 
   */
  instance: any;
  /**
   * The method name on the given object that will be invoked
   */
  methodName: string;
  /**
   * Arguments that will be passed to the specified method
   */
  methodArguments?: unknown[];
  /**
   * If any, the results of the method invocation are assigned to the property
   */
  methodResult?: unknown;
}

/**
 * This operation invokes the specified method on the given object with the given optional arguments
 * and assigns the result to the `methodResult` operationdata property.
 *
 * @param operationData
 * @returns
 */
export const invokeObjectMethod: TOperation<IInvokeObjectMethodOperationData, Omit<IInvokeObjectMethodOperationData, 'methodName' | 'methodArguments'>> =
  function (operationData: IInvokeObjectMethodOperationData) {
    const { methodName, methodArguments, ...newOperationData } = operationData;

    const func = operationData.instance[methodName];
    if (typeof func === 'function') {
      newOperationData.methodResult = func.apply(operationData.instance, methodArguments ?? []);
    } else {
      console.error(`The given member name ${methodName} is not a function`);
    }

    return newOperationData;
  };
