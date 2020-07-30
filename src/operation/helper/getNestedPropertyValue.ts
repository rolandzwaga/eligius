import getNestedValue from './getNestedValue';

function getNestedPropertyValue(propertyChain: string, sourceObject: any) {
  const properties = propertyChain.split('.');
  return getNestedValue(properties, sourceObject);
}

export default getNestedPropertyValue;
