import { IAddGlobalsToOperationData } from '../add-globals-to-operation';
import { IOperationMetadata } from './types';

function addGlobalsToOperation(): IOperationMetadata<IAddGlobalsToOperationData> {
  return {
    description: 'Add global properties to the current operation data.',
    properties: {
      globalProperties: {
        type: 'ParameterType:array',
        itemType: 'ParameterType:string',
        required: true,
      },
    },
  };
}
export default addGlobalsToOperation;
