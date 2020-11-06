import getNestedValue from './get-nested-value';

function getNestedPropertyValue(propertyChain: string, sourceObject: any) {
  const properties = propertyChain.split('.');
  return getNestedValue(properties, sourceObject);
}

export default getNestedPropertyValue;
