import { ISetDataOperationData } from '../set-data';
import { IOperationMetadata } from './types';

function setData(): IOperationMetadata<ISetDataOperationData> {
  return {
    description: 'Copies the specified values to the specified targets',
    properties: {
      properties: {
        type: 'ParameterType:object',
        required: true,
      },
    },
  };
}
export default setData;
