import { getNestedValue } from './get-nested-value';
import { getGlobals } from './globals';

export function extractOperationDataArgumentValues(
  sourceObject: any,
  argumentValue: string | any
) {
  if (
    typeof argumentValue === 'string' &&
    argumentValue.toLowerCase().startsWith('operationdata.')
  ) {
    const propNames = argumentValue.split('.');
    propNames.shift();
    return getNestedValue(propNames, sourceObject);
  }

  if (
    typeof argumentValue === 'string' &&
    argumentValue.toLowerCase().startsWith('globaldata.')
  ) {
    const propNames = argumentValue.split('.');
    propNames.shift();
    return getNestedValue(propNames, getGlobals());
  }

  return argumentValue;
}
