import ParameterTypes from './ParameterTypes';

function getControllerFromElement() {
  return {
    description: 'Retrieves the specified controller from the current element',
    dependentProperties: ['selectedElement'],
    properties: {
      controllerName: {
        type: ParameterTypes.CONTROLLER_NAME,
        required: true,
      },
    },
    outputProperties: ['controllerInstance'],
  };
}
export default getControllerFromElement;
