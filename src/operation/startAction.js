import mergeOperationData from './helper/mergeOperationData';
import internalResolve from './helper/internalResolve';

function startAction(operationData, eventBus) {
    const {actionInstance, actionOperationData} = operationData;
    return new Promise((resolve, reject)=> {
        operationData = mergeOperationData(operationData, actionOperationData);
        actionInstance.start(operationData).then(() => {
            internalResolve(resolve, operationData);
        }, reject);
    });
}

export default startAction;
