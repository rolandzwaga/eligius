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
    return resolvedProperties;
  }

  const undefinedValues = Object.entries(resolvedProperties).filter(
    ([_, value]) => value === undefined
  );

  operationData = {
    ...operationData,
    ...resolvedProperties,
  };

  /**
   * For some reason merging of objects doesn't seem to be deterministic across environments
   * when it comes to undefined property values.
   *
   * So, it seems that {...{foo:'bar'}, ...{foo: undefined}} sometimes yields {foo:'bar'}, but
   * {foo: undefined} in other cases.
   *
   * Therefore, for now we just set the undefined properties explicitly.
   */
  undefinedValues.forEach(
    ([name]) => ((operationData as any)[name] = undefined)
  );

  return operationData;
};
