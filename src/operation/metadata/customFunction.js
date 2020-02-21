import ParameterTypes from './ParameterTypes';

function customFunction() {
  return {
    description: 'Executes the specified custom function',
    properties: {
      systemName: ParameterTypes.SYSTEM_NAME,
    },
  };
}
export default customFunction;
