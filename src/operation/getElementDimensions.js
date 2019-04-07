import modifyDimensions from './helper/modifyDimensions';

function getElementDimensions(operationData, eventBus) {
    let {selectedElement, dimensions, modifier} = operationData;
    dimensions = dimensions || {};
    dimensions.width = selectedElement.innerWidth();
    dimensions.height = selectedElement.innerHeight();
    if (dimensions.height === 0) {
        dimensions.height = dimensions.width;
    }
    if (modifier) {
        modifyDimensions(dimensions, modifier);
    }
    return operationData;
}

export default getElementDimensions;
