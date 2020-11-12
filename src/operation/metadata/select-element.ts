import { ISelectElementOperationData } from '~/operation/select-element';
import { IOperationMetadata } from './types';

function selectElement(): IOperationMetadata<ISelectElementOperationData> {
  return {
    description: 'Selects an element using the given selector',
    properties: {
      selector: {
        type: 'ParameterType:selector',
        required: true,
      },
      propertyName: 'ParameterType:string',
      useSelectedElementAsRoot: 'ParameterType:boolean',
    },
    outputProperties: {
      selectedElement: 'ParameterType:object',
    },
  };
}
export default selectElement;
