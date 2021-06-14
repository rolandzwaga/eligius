import { getNestedValue } from './get-nested-value';

export function getNestedPropertyValue(
  propertyChain: string,
  sourceObject: any
) {
  const properties = propertyChain.split('.');
  return getNestedValue(properties, sourceObject);
}
