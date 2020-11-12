import { IAddOptionListOperationData } from '~/operation/add-option-list';
import { IOperationMetadata } from './types';

function addOptionList(): IOperationMetadata<IAddOptionListOperationData> {
  return {
    description:
      'Creates a list of option elements from the specified data and adds it to the currently selected element.',
    dependentProperties: ['selectedElement'],
    properties: {
      valueProperty: {
        type: 'ParameterType:string',
        required: true,
      },
      labelProperty: {
        type: 'ParameterType:string',
        required: true,
      },
      defaultIndex: 'ParameterType:integer',
      defaultValue: 'ParameterType:string',
      optionData: 'ParameterType:array',
    },
  };
}
export default addOptionList;
