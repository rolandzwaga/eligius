import ParameterTypes from './ParameterTypes';

function setOperationData() {
  return {
    description: 'Sets the given properties on the current operation data',
    properties: {
      properties: {
        type: ParameterTypes.OBJECT,
        required: true,
      },
      override: ParameterTypes.BOOLEAN,
    },
  };
}
export default setOperationData;
