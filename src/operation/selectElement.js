import TimelineEventNames from '../timeline-event-names';

function selectElement(operationData, eventBus) {
    let {selector, propertyName, useExistingAsRoot} = operationData;

    if (!selector) {
        throw new Error("selector is undefined!");
    }
    propertyName = (propertyName) ? propertyName : "selectedElement";
    const rootCallback = (root)=> {
        const currentRoot = (useExistingAsRoot && operationData[propertyName]) ? operationData[propertyName] : root;
        const element = currentRoot.find(selector);
        if (!element.length) {
            console.warn(`selector '${selector}' wasn't found!`);
        }
        operationData[propertyName] = element;
        if (operationData.hasOwnProperty("propertyName")) {
            delete operationData.propertyName;
        }
    };
    eventBus.broadcast(TimelineEventNames.REQUEST_ENGINE_ROOT, [rootCallback]);
    return operationData;
}

export default selectElement;