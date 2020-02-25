import ParameterTypes from './ParameterTypes';

function startLoop() {
  return {
    description: 'Starts a loop over the given collection',
    properties: {
      collection: {
        type: ParameterTypes.ARRAY,
        required: true,
      },
      propertyName: {
        type: ParameterTypes.STRING,
        required: true,
      },
    },
  };
}

export default startLoop;
