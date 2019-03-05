import getNestedValue from './getNestedValue';

function extractOperationDataArgumentValues(sourceObject, argumentValue) {
    if ((argumentValue) && (argumentValue.substr) && (argumentValue.substr(0, 14).toLowerCase() === "operationdata.")) {
        let propNames = argumentValue.split('.');
        return getNestedValue(propNames, sourceObject);
    }
    return argumentValue;
}

export default extractOperationDataArgumentValues;
