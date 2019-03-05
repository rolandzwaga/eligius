import mergeOperationData from './mergeOperationData';

function internalResolve(resolve, operationData, newOperationData) {
    if (newOperationData) {
        resolve(mergeOperationData(operationData, newOperationData));
    } else {
        resolve(operationData);
    }
}

export default internalResolve;
