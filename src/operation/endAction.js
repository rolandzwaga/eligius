import mergeOperationData from './helper/mergeOperationData';
import internalResolve from './helper/internalResolve';

function endAction(operationData, eventBus) {
    const {actionInstance, actionOperationData} = operationData;
    delete operationData.actionOperationData;
    return new Promise((resolve, reject)=> {
        const mergedData = mergeOperationData(operationData, actionOperationData);
        actionInstance.end(mergedData).then(() => {
            internalResolve(resolve, operationData);
        }, reject);
    });
}

export default endAction;
