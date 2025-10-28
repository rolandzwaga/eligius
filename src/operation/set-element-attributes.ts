import type {TOperation} from './types.ts';

export interface ISetElementAttributesOperationData {
  /**
   * @required
   * @erased
   */
  attributes: Record<string, unknown>;
  /**
   * @dependency
   */
  selectedElement: JQuery;
}

/**
 * This operation sets the specified set of attributes on the given selected element.
 */
export const setElementAttributes: TOperation<
  ISetElementAttributesOperationData, Omit<ISetElementAttributesOperationData, 'attributes'>
> = (operationData: ISetElementAttributesOperationData) => {
  const {attributes, selectedElement} = operationData;
  delete (operationData as any).attributes;
  selectedElement.attr(attributes);
  return operationData;
};
