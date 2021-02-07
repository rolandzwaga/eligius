import { IExtendControllerOperationData } from '../../operation/extend-controller';
import { IOperationMetadata } from './types';

function extendController(): IOperationMetadata<IExtendControllerOperationData> {
  return {
    description: 'Extends the current controller',
    dependentProperties: ['controllerInstance'],
    properties: {
      controllerExtension: 'ParameterType:object',
    },
  };
}
export default extendController;
