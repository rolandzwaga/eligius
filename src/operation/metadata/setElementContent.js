import ParameterTypes from './ParameterTypes';

function setElementContent() {
  return {
    description: 'Sets the given HTML content in the selected element',
    dependentProperties: ['selectedElement'],
    properties: {
      append: ParameterTypes.BOOLEAN,
      template: {
        type: ParameterTypes.HTML_CONTENT,
        required: true,
      },
    },
  };
}
export default setElementContent;
