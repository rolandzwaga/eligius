import mergeOperationData from './helper/mergeOperationData';
import internalResolve from './helper/internalResolve';

function endAction(operationData, eventBus) {
    const {actionInstance, actionOperationData} = operationData;
    return new Promise((resolve, reject)=> {
        operationData = mergeOperationData(operationData, actionOperationData);
        actionInstance.end(operationData).then(() => {
            internalResolve(resolve, operationData);
        }, reject);
    });
}

export default endAction;
