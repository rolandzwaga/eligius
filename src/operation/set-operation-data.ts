import {resolvePropertyValues} from '@operation/helper/resolve-property-values.ts';
import type {TOperation} from '@operation/types.ts';

export interface ISetOperationData {
  /**
   * If set to true, the plucked properties replace the current operation data.
   * @erased
   */
  override?: boolean;
  /**
   * @required
   * @erased
   */
  properties: Record<string, any>;
}

/**
 * This operation assigns the specified properties to the current operation data.
 * When override is set to true the properties replace the current operation data entirely.
 *
 * @category Data
 */
export const setOperationData: TOperation<
  ISetOperationData,
  Omit<ISetOperationData, 'override' | 'properties'>
> = function (operationData: ISetOperationData) {
  const {override = false, properties, ...newOperationData} = operationData;

  const resolvedProperties = resolvePropertyValues(
    newOperationData,
    this,
    properties
  );

  if (override) {
    return resolvedProperties;
  }

  return {
    ...newOperationData,
    ...resolvedProperties,
  };
};
