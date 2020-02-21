import ParameterTypes from './ParameterTypes';

function removePropertiesFromOperationData() {
  return {
    description: 'Removes the specified properties from the current operation data',
    properties: {
      propertyNames: ParameterTypes.ARRAY,
    },
  };
}
export default removePropertiesFromOperationData;
