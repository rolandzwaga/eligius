import ParameterTypes from './ParameterTypes';

function toggleClass() {
  return {
    description: 'Toggles the given class on the selected element',
    dependentProperties: ['selectedElement'],
    properties: {
      className: {
        type: ParameterTypes.CLASS_NAME,
        required: true,
      },
    },
  };
}
export default toggleClass;
