import getNestedValue from './getNestedValue';

function extractOperationDataArgumentValues(sourceObject, argumentValue) {
  if (typeof argumentValue === 'string' && argumentValue.toLowerCase().startsWith('operationdata.')) {
    const propNames = argumentValue.split('.');
    propNames.shift();
    return getNestedValue(propNames, sourceObject);
  }
  return argumentValue;
}

export default extractOperationDataArgumentValues;
