import { TOperation } from './types';

export interface IInvokeObjectMethodOperationData {
  instance: any;
  methodName: string;
  methodArguments?: any[];
  methodResult?: any;
}

/**
 * This operation invokes the specified method on the given object with the optional specified arguments
 * and assigns the result to the `methodResult` property.
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
