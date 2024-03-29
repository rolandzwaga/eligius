import { TOperation } from './types';

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
  methodArguments?: any[];
  /**
   * If any, the results of the method invocation are assigned to the property
   */
  methodResult?: any;
}

/**
 * This operation invokes the specified method on the given object with the given optional arguments
 * and assigns the result to the `methodResult` operationdata property.
 *
 * @param operationData
 * @returns
 */
export const invokeObjectMethod: TOperation<IInvokeObjectMethodOperationData> =
  function (operationData: IInvokeObjectMethodOperationData) {
    const { methodName, methodArguments } = operationData;
    delete (operationData as any).methodName;
    delete (operationData as any).methodArguments;

    operationData.methodResult = (operationData.instance as any)[
      methodName
    ].apply(operationData.instance, methodArguments ?? []);

    return operationData;
  };
