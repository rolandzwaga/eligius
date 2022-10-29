import { ISelectElementOperationData } from '../../operation/select-element';
import { IOperationMetadata } from './types';

function selectElement(): IOperationMetadata<ISelectElementOperationData> {
  return {
    description: 'Selects an element using the given selector',
    properties: {
      selector: {
        type: 'ParameterType:selector',
        required: true,
      },
      useSelectedElementAsRoot: 'ParameterType:boolean',
    },
    outputProperties: {
      selectedElement: 'ParameterType:jQuery',
    },
  };
}
export default selectElement;
