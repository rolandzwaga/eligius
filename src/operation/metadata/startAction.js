import ParameterTypes from './ParameterTypes';

function startAction() {
  return {
    description: 'Starts the selected action',
    dependentProperties: ['actionInstance'],
    properties: {
      actionOperationData: ParameterTypes.OBJECT,
    },
  };
}
export default startAction;
