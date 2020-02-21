import ParameterTypes from './ParameterTypes';

function animateWithClass() {
  return {
    description: 'Animates the selected element by adding the given animation class.',
    className: {
      type: ParameterTypes.CLASS_NAME,
      required: true,
    },
    removeClass: {
      type: ParameterTypes.BOOLEAN,
    },
  };
}
export default animateWithClass;
