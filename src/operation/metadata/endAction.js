import ParameterTypes from './ParameterTypes';

function endAction() {
  return {
    description: 'Ends the current action',
    dependentProperties: ['actionInstance'],
    properties: {
      actionOperationData: ParameterTypes.OBJECT,
    },
  };
}
export default endAction;
