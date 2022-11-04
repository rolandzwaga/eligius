import { resolvePropertyValues } from './helper/resolve-property-values';
import { TOperation } from './types';

export interface ISetOperationData {
  override?: boolean;
  properties: Record<string, any>;
}

/**
 * This operation assigns the specified properties to the current operation data.
 * When override is set to true the properties replace the current operation data entirely.
 *
 * @param operationData
 * @returns
 */
export const setOperationData: TOperation<ISetOperationData> = function (
  operationData: ISetOperationData
) {
  const { override = false, properties } = operationData;
  delete (operationData as any).properties;
  delete operationData.override;

  const resolvedProperties = resolvePropertyValues(
    operationData,
    this,
    properties
  );

  if (override) {
    operationData = resolvedProperties;
  } else {
    operationData = {
      ...operationData,
      ...resolvedProperties,
    };
  }

  return operationData;
};
