import ParameterTypes from './ParameterTypes';

function endAction() {
  return {
    description: 'Ends the current action',
    properties: {
      actionOperationData: ParameterTypes.OBJECT,
    },
  };
}
export default endAction;
