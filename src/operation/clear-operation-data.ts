import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';

export interface IClearOperationDataOperationData {
  /**
   * @erased
   */
  properties?: string[];
}

/**
 * This operation removes all of the properties on the current operation date.
 * Or, if the `properties` property is set only removes the properties defined by that list.
 *
 * @category Data
 */
export const clearOperationData: TOperation<
  IClearOperationDataOperationData,
  Omit<IClearOperationDataOperationData, 'properties'>
> = (operationData: IClearOperationDataOperationData) => {
  const {properties} = operationData;

  if (properties) {
    properties.forEach(name => {
      delete (operationData as any)[name];
    });
    removeProperties(operationData, 'properties');
    return operationData;
  }

  return {};
};
