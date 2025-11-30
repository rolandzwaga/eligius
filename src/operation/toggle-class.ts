import type {TOperation} from '@operation/types.ts';

export interface IToggleClassOperationData {
  /**
   * The element on which the class will be toggled
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * The class that will be toggled
   * @type=ParameterType:className
   * @required
   * @erased
   */
  className: string;
}

/**
 * This operation toggles the specfied class name on the given selected element.
 *
 * Meaning, if the specified class name exists on the given element it will be removed,
 * otherwise it will be added.
 *
 * @category DOM
 */
export const toggleClass: TOperation<
  IToggleClassOperationData,
  Omit<IToggleClassOperationData, 'className'>
> = (operationData: IToggleClassOperationData) => {
  const {selectedElement, className} = operationData;
  selectedElement.toggleClass(className);
  delete (operationData as any).className;
  return operationData;
};
