function selectElement(operationData, eventBus) {
    let {selector,propertyName,useExistingAsRoot} = operationData;

    if (!selector) {
        throw new Error("selector is undefined!");
    }
    propertyName = (propertyName) ? propertyName : "selectedElement";
    const rootCallback = (root)=> {
        const currentRoot = (useExistingAsRoot && operationData[propertyName]) ? operationData[propertyName] : root;
        const element = currentRoot.find(operationData.selector);
        if (!element.length) {
            console.warn(`selector '${operationData.selector}' wasn't found!`);
        }
        operationData[propertyName] = element;
        if (operationData.hasOwnProperty("propertyName")) {
            delete operationData.propertyName;
        }
    };
    eventBus.broadcast("request-engine-root", [rootCallback]);
    return operationData;
}

export default selectElement;