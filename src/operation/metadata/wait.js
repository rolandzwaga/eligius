import ParameterTypes from './ParameterTypes';

function wait() {
  return {
    description: 'Waits for the given amount of milliseconds before the action continues',
    properties: {
      milliseconds: {
        type: ParameterTypes.INTEGER,
        required: true,
      },
    },
  };
}
export default wait;
