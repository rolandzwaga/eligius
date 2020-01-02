import ParameterTypes from './parameterTypes';

function addClass() {
  return {
    description: 'Add a class to the selected element(s)',
    className: {
      type: ParameterTypes.CLASS_NAME,
      requires: true,
    },
  };
}
export default addClass;
