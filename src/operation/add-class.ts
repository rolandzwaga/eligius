import type {TOperation} from './types.ts';

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
 */
export const addClass: TOperation<IAddClassOperationData, Omit<IAddClassOperationData, 'className'>> = operationData => {
  const {selectedElement, className} = operationData;
  delete (operationData as any).className;
  selectedElement.addClass(className);

  return operationData;
};
