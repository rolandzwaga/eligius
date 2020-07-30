import ParameterTypes from './ParameterTypes';
import { IOperationMetadata } from './types';

function removePropertiesFromOperationData(): IOperationMetadata {
  return {
    description: 'Removes the specified properties from the current operation data',
    properties: {
      propertyNames: ParameterTypes.ARRAY,
    },
  };
}
export default removePropertiesFromOperationData;
