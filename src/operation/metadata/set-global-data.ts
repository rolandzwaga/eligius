import { ISetGlobalDataOperationData } from '../set-global-data';
import { IOperationMetadata } from './types';

function setGlobalData(): IOperationMetadata<ISetGlobalDataOperationData> {
  return {
    description:
      'Copies the specified values from the operationData to the global data',
    properties: {
      properties: {
        type: 'ParameterType:array',
        required: true,
      },
    },
  };
}
export default setGlobalData;
