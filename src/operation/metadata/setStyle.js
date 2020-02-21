import ParameterTypes from './ParameterTypes';

function setStyle() {
  return {
    description: 'Sets the given style properties on the selected element',
    dependentProperties: ['selectedElement'],
    properties: {
      properties: {
        type: ParameterTypes.OBJECT,
        required: true,
      },
    },
  };
}

export default setStyle;
