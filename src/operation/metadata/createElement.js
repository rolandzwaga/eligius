import ParameterTypes from './ParameterTypes';

function customFunction() {
  return {
    description: 'Creates an HTML element with the given name and optionally adds the given attributes',
    properties: {
      elementName: {
        type: ParameterTypes.HTML_ELEMENT_NAME,
        required: true,
      },
      attributes: ParameterTypes.OBJECT,
    },
    outputProperties: {
      template: ParameterTypes.OBJECT,
    },
  };
}
export default customFunction;
