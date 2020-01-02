import extractOperationDataArgumentValues from './extractOperationDataArgumentValues';
import deepcopy from './deepcopy';

function resolvePropertyValues(operationData, properties) {
    const copy = deepcopy(properties);
    const extract = extractOperationDataArgumentValues.bind(null, operationData);
    for(let propertyName in properties) {
        const propertyValue = properties[propertyName];
        copy[propertyName] = extract(propertyValue);
    }
    return copy;
}

export default resolvePropertyValues;
