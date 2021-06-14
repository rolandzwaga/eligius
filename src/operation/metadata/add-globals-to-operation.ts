import { IAddControllerToElementOperationData } from '../../operation/add-controller-to-element';
import { IOperationMetadata } from './types';

function addGlobalsToOperation(): IOperationMetadata<
  IAddControllerToElementOperationData
> {
  return {
    description: 'Add global properties to the current operation data.',
    dependentProperties: ['selectedElement'],
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
