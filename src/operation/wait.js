import internalResolve from './helper/internalResolve';

function wait(operationData, eventBus) {
    const { milliseconds } = operationData;
    return new Promise((resolve) => {
        setTimeout(() => {
            internalResolve(resolve, operationData);
        }, milliseconds);
    });
}

export default wait;
