import ParameterTypes from './ParameterTypes';

function getControllerInstance() {
  return {
    description: 'Retrieves an instance of the specified controller',
    properties: {
      systemName: {
        type: ParameterTypes.CONTROLLER_NAME,
        required: true,
      },
      propertyName: {
        type: ParameterTypes.STRING,
        defaultValue: 'controllerInstance',
      },
    },
    outputProperties: {
      controllerInstance: ParameterTypes.OBJECT,
    },
  };
}
export default getControllerInstance;
