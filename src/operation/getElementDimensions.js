import modifyDimensions from './helper/modifyDimensions';

function getElementDimensions(operationData, eventBus) {
  const { selectedElement, modifier } = operationData;
  let { dimensions } = operationData;
  dimensions = dimensions || {};
  dimensions.width = selectedElement.innerWidth();
  dimensions.height = selectedElement.innerHeight();
  if (dimensions.height === 0) {
    dimensions.height = dimensions.width;
  }
  if (modifier) {
    modifyDimensions(dimensions, modifier);
  }
  operationData.dimensions = dimensions;
  return operationData;
}

export default getElementDimensions;
