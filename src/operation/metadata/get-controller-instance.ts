import { IGetControllerInstanceOperationData } from '../../operation/get-controller-instance';
import { IOperationMetadata } from './types';

function getControllerInstance(): IOperationMetadata<
  IGetControllerInstanceOperationData
> {
  return {
    description: 'Retrieves an instance of the specified controller',
    properties: {
      systemName: {
        type: 'ParameterType:controllerName',
        required: true,
      },
    },
    outputProperties: {
      controllerInstance: 'ParameterType:object',
    },
  };
}
export default getControllerInstance;
