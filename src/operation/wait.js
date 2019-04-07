import internalResolve from './helper/internalResolve';

function wait(operationData, eventBus) {
    return new Promise((resolve) => {
        setTimeout(() => {
            internalResolve(resolve, operationData);
        }, operationData.milliseconds);
    });
}

export default wait;
