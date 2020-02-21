import ParameterTypes from './ParameterTypes';

function animateWithClass() {
  return {
    description: 'Animates the selected element by adding the given animation class.',
    dependentProperties: ['selectedElement'],
    properties: {
      className: {
        type: ParameterTypes.CLASS_NAME,
        required: true,
      },
      removeClass: ParameterTypes.BOOLEAN,
    },
  };
}
export default animateWithClass;
