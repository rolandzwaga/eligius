import ParameterTypes from './ParameterTypes';
import { IOperationMetadata } from './types';

function getImport(): IOperationMetadata {
  return {
    description: 'Retrieves a javascript import specified by the given system name',
    properties: {
      systemName: {
        type: ParameterTypes.SYSTEM_NAME,
        required: true,
      },
    },
    outputProperties: {
      importedInstance: ParameterTypes.OBJECT,
    },
  };
}
export default getImport;
