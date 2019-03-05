import extractOperationDataArgumentValues from './extractOperationDataArgumentValues';

function resolvePropertyValues(operationData, properties) {
    const copy = Object.assign({}, properties);
    const extract = extractOperationDataArgumentValues.bind(null, operationData);
    for(let propertyName in properties) {
        const propertyValue = properties[propertyName];
        copy[propertyName] = extract(propertyValue);
    }
    return copy;
}

export default resolvePropertyValues
