import ParameterTypes from './ParameterTypes';

function extendController() {
  return {
    description: 'Extends the current controller',
    dependentProperties: ['controllerInstance'],
    properties: {
      controllerExtension: ParameterTypes.OBJECT,
    },
  };
}
export default extendController;
