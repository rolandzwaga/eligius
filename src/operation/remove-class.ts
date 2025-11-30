import type {TOperation} from '@operation/types.ts';

export interface IRemoveClassOperationData {
  /**
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @type=ParameterType:className
   * @required
   * @erased
   */
  className: string;
}

/**
 * This operation removes the spcified class name from the given selected element.
 *
 * @param operationData
 * @returns
 * @category DOM
 */
export const removeClass: TOperation<
  IRemoveClassOperationData,
  Omit<IRemoveClassOperationData, 'className'>
> = (operationData: IRemoveClassOperationData) => {
  const {selectedElement, className} = operationData;
  delete (operationData as any).className;
  selectedElement.removeClass(className);
  return operationData;
};
