import { IRemovePropertiesFromOperationDataOperationData } from '../../operation/remove-properties-from-operation-data';
import { IOperationMetadata } from './types';

function removePropertiesFromOperationData(): IOperationMetadata<IRemovePropertiesFromOperationDataOperationData> {
  return {
    description: 'Removes the specified properties from the current operation data',
    properties: {
      propertyNames: 'ParameterType:array',
    },
  };
}
export default removePropertiesFromOperationData;
