import type {TOperation} from './types.ts';

export interface IAddClassOperationData {
  /**
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @type=ParameterType:className
   * @required
   */
  className: string;
}

/**
 * This operation adds the specified class name to the specified selected element.
 *
 */
export const addClass: TOperation<IAddClassOperationData> = operationData => {
  const {selectedElement, className} = operationData;
  selectedElement.addClass(className);
  return operationData;
};
