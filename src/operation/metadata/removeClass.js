import ParameterTypes from './ParameterTypes';

function removeClass() {
  return {
    description: 'Removes the specified class from the selected element',
    dependentProperties: ['selectedElement'],
    properties: {
      className: {
        type: ParameterTypes.CLASS_NAME,
        required: true,
      },
    },
  };
}
export default removeClass;
