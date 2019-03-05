import attachControllerToElement from './helper/attachControllerToElement';
import internalResolve from './helper/internalResolve';

function addControllerToElement(operationData, eventBus) {
    const {selectedElement, controllerInstance} = operationData;
    
    attachControllerToElement(selectedElement, controllerInstance);
    
    controllerInstance.init(operationData);

    const promise = controllerInstance.attach(eventBus);

    if (promise) {
        return new Promise((resolve, reject)=> {
            promise.then((newOperationData) => {
                internalResolve(resolve, operationData, newOperationData);
            }, reject);
        })
    } else {
        return operationData;
    }
}

export default addControllerToElement;
