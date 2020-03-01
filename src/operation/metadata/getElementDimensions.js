import ParameterTypes from './ParameterTypes';

function getElementDimensions() {
  return {
    description: 'Calculates the dimensions for the current element',
    dependentProperties: ['selectedElement'],
    properties: {
      modifier: ParameterTypes.DIMENSIONS_MODIFIER,
    },
    outputProperties: {
      dimensions: ParameterTypes.DIMENSIONS,
    },
  };
}
export default getElementDimensions;
