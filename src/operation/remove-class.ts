import type {TOperation} from './types.ts';

export interface IRemoveClassOperationData {
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
 * This operation removes the spcified class name from the given selected element.
 *
 * @param operationData
 * @returns
 */
export const removeClass: TOperation<IRemoveClassOperationData> = (
  operationData: IRemoveClassOperationData
) => {
  const {selectedElement, className} = operationData;
  selectedElement.removeClass(className);
  return operationData;
};
