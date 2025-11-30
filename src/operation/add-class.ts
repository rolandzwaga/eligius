import type {TOperation} from '@operation/types.ts';

export interface IAddClassOperationData {
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
 * This operation adds the specified class name to the specified selected element.
 *
 * @category DOM
 */
export const addClass: TOperation<
  IAddClassOperationData,
  Omit<IAddClassOperationData, 'className'>
> = operationData => {
  const {selectedElement, className} = operationData;
  delete (operationData as any).className;
  selectedElement.addClass(className);

  return operationData;
};
