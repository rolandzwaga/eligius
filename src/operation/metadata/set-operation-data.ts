import { ISetOperationData } from '../set-operation-data';
import { IOperationMetadata } from './types';

function setOperationData(): IOperationMetadata<ISetOperationData> {
  return {
    description: 'Sets the given properties on the current operation data',
    properties: {
      properties: {
        type: 'ParameterType:object',
        required: true,
      },
      override: 'ParameterType:boolean',
    },
  };
}
export default setOperationData;
