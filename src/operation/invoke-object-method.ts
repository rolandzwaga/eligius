import {isForbiddenPropertyChainSegment} from '@operation/helper/assert-safe-property-chain.ts';
import type {TOperation} from '@operation/types.ts';

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
 * The method names `constructor`, `__proto__` and `prototype`, and the `Function` constructor
 * as instance, are refused so a configuration cannot build and run arbitrary code.
 *
 * @param operationData
 * @throws When the method name or instance is refused.
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

  if (isForbiddenPropertyChainSegment(methodName)) {
    throw new Error(
      `invokeObjectMethod: method name '${methodName}' is not allowed`
    );
  }
  if (operationData.instance === Function) {
    throw new Error(
      'invokeObjectMethod: invoking methods on the Function constructor is not allowed'
    );
  }

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
