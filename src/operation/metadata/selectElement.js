import ParameterTypes from './ParameterTypes';

function selectElement() {
  return {
    description: 'Selects an element using the given selector',
    properties: {
      selector: {
        type: ParameterTypes.SELECTOR,
        required: true,
      },
      propertyName: ParameterTypes.STRING,
      useSelectedElementAsRoot: ParameterTypes.BOOLEAN,
    },
    outputProperties: ['selectedElement'],
  };
}
export default selectElement;
