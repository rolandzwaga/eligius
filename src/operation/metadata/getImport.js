import ParameterTypes from './ParameterTypes';

function getImport() {
  return {
    properties: {
      systemName: {
        type: ParameterTypes.SYSTEM_NAME,
        required: true,
      },
    },
    outputProperties: ['importedInstance'],
  };
}
export default getImport;
