import modifyDimensions from './helper/modifyDimensions';

function getElementDimensions(operationData, eventBus) {
  const { selectedElement, modifier } = operationData;
  const dimensions = {
    width: selectedElement.innerWidth(),
    height: selectedElement.innerHeight(),
  };
  if (dimensions.height === 0) {
    dimensions.height = dimensions.width;
  }
  if (modifier && modifier.length) {
    modifyDimensions(dimensions, modifier);
  }
  operationData.dimensions = dimensions;
  return operationData;
}

export default getElementDimensions;
