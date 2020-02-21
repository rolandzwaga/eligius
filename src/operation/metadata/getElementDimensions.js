import ParameterTypes from './ParameterTypes';

function getElementDimensions() {
  return {
    description: 'Calculates the dimensions for the current element',
    dependentProperties: ['selectedElement'],
    properties: {
      dimensions: ParameterTypes.DIMENSIONS,
      modifier: ParameterTypes.DIMENSIONS_MODIFIER,
    },
    outputProperties: ['dimensions'],
  };
}
export default getElementDimensions;
