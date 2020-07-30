import ParameterTypes from './ParameterTypes';
import { IOperationMetadata } from './types';
import { IAddOptionListOperationData } from '../addOptionList';

function addOptionList(): IOperationMetadata<IAddOptionListOperationData> {
  return {
    description:
      'Creates a list of option elements from the specified data and adds it to the currently selected element.',
    dependentProperties: ['selectedElement'],
    properties: {
      valueProperty: {
        type: ParameterTypes.STRING,
        required: true,
      },
      labelProperty: {
        type: ParameterTypes.STRING,
        required: true,
      },
      defaultIndex: ParameterTypes.INTEGER,
      defaultValue: ParameterTypes.STRING,
      optionData: ParameterTypes.ARRAY,
    },
  };
}
export default addOptionList;
