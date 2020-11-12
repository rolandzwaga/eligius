import { IClearOperationDataOperationData } from '~/operation/clear-operation-data';
import { IOperationMetadata } from './types';

function clearOperationData(): IOperationMetadata<IClearOperationDataOperationData> {
  return {
    description: 'clears the current operation data',
    properties: {
      properties: 'ParameterType:array',
    },
  };
}
export default clearOperationData;
