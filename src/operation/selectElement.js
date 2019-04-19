import TimelineEventNames from '../timeline-event-names';

function findElementBySelector(root, selector, operationData, propertyName) {
    const element = root.find(selector);
    if (!element.length) {
        console.warn(`selector '${selector}' wasn't found!`);
    }
    operationData[propertyName] = element;
    if (operationData.hasOwnProperty("propertyName")) {
        delete operationData.propertyName;
    }
}

function selectElement(operationData, eventBus) {
    let {selector, propertyName, useExistingAsRoot} = operationData;

    if (!selector) {
        throw new Error("selector is undefined!");
    }
    propertyName = (propertyName) ? propertyName : "selectedElement";

    if (useExistingAsRoot && operationData[propertyName]) {
        const currentRoot = operationData[propertyName];
        findElementBySelector(currentRoot, selector, operationData, propertyName);
        return operationData;
    }

    const rootCallback = (root)=> {
        findElementBySelector(root, selector, operationData, propertyName);
    };
    eventBus.broadcast(TimelineEventNames.REQUEST_ENGINE_ROOT, [rootCallback]);
    return operationData;
}

export default selectElement;
