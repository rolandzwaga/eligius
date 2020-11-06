import { IGetImportOperationData } from '../get-import';
import { IOperationMetadata } from './types';

function getImport(): IOperationMetadata<IGetImportOperationData> {
  return {
    description: 'Retrieves a javascript import specified by the given system name',
    properties: {
      systemName: {
        type: 'ParameterType:systemName',
        required: true,
      },
    },
    outputProperties: {
      importedInstance: 'ParameterType:object',
    },
  };
}
export default getImport;
