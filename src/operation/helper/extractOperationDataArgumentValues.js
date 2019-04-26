import getNestedValue from './getNestedValue';

function extractOperationDataArgumentValues(sourceObject, argumentValue) {
    if ((argumentValue) && (argumentValue.toLowerCase) && (argumentValue.toLowerCase().startsWith('operationdata.'))) {
        let propNames = argumentValue.split('.');
        propNames.shift();
        return getNestedValue(propNames, sourceObject);
    }
    return argumentValue;
}

export default extractOperationDataArgumentValues;
