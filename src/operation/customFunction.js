import internalResolve from './helper/internalResolve';

function customFunction(operationData, eventBus) {
    const {systemName} = operationData;
    return new Promise((resolve, reject)=> {
        const resultCallback = (func)=> {
            const promise = func(eventBus, operationData);
            promise.then(() => {
                internalResolve(resolve, {}, operationData);
            }, reject);
        };
        eventBus.broadcast("request-function", [systemName, resultCallback]);
    });
}

export default customFunction;
