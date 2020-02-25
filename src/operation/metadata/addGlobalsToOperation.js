import ParameterTypes from './ParameterTypes';

function addGlobalsToOperation() {
  return {
    description: 'Add global properties to the current operation data.',
    dependentProperties: ['selectedElement'],
    properties: {
      globalProperties: {
        type: ParameterTypes.OBJECT,
        required: true,
      },
    },
  };
}
export default addGlobalsToOperation;
