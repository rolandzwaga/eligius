import { IGetControllerInstanceOperationData } from '../getControllerInstance';
import { IOperationMetadata } from './types';

function getControllerInstance(): IOperationMetadata<IGetControllerInstanceOperationData> {
  return {
    description: 'Retrieves an instance of the specified controller',
    properties: {
      systemName: {
        type: 'ParameterType:controllerName',
        required: true,
      },
      propertyName: {
        type: 'ParameterType:string',
        defaultValue: 'controllerInstance',
      },
    },
    outputProperties: {
      controllerInstance: 'ParameterType:object',
    },
  };
}
export default getControllerInstance;
