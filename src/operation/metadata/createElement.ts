import ParameterTypes from './ParameterTypes';
import { IOperationMetadata } from './types';

function customFunction(): IOperationMetadata {
  return {
    description: 'Creates an HTML element with the given name and optionally adds the given attributes',
    properties: {
      elementName: {
        type: ParameterTypes.HTML_ELEMENT_NAME,
        required: true,
      },
      attributes: ParameterTypes.OBJECT,
      text: ParameterTypes.STRING,
    },
    outputProperties: {
      template: ParameterTypes.OBJECT,
    },
  };
}
export default customFunction;