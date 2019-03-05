import mergeOperationData from './helper/mergeOperationData';

function resizeAction(operationData, eventBus) {
    const {actionInstance, actionOperationData} = operationData;
    operationData = mergeOperationData(operationData, actionOperationData);
    if (actionInstance.resize) {
        return actionInstance.resize(operationData);
    }
    return operationData;
}

export default resizeAction;
