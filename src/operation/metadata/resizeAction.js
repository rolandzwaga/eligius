import ParameterTypes from './ParameterTypes';

function resizeAction() {
  return {
    description: 'Triggers a resize on the current action',
    dependentProperties: ['actionInstance'],
    properties: {
      actionOperationData: ParameterTypes.OBJECT,
    },
  };
}
export default resizeAction;
