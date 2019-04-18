import internalResolve from './helper/internalResolve';
import TimelineEventNames from '../timeline-event-names';

function customFunction(operationData, eventBus) {
    const {systemName} = operationData;
    return new Promise((resolve, reject) => {
        const resultCallback = (func)=> {
            const promise = func(operationData, eventBus);
            if (promise) {
                promise.then(() => {
                    internalResolve(resolve, {}, operationData);
                }, reject);
            } else {
                internalResolve(resolve, {}, operationData);
            }
        };
        eventBus.broadcast(TimelineEventNames.REQUEST_FUNCTION, [systemName, resultCallback]);
    });
}

export default customFunction;
