import ParameterTypes from './ParameterTypes';

function clearOperationData() {
  return {
    description: 'clears the current operation data',
    properties: {
      properties: ParameterTypes.ARRAY,
    },
  };
}
export default clearOperationData;
