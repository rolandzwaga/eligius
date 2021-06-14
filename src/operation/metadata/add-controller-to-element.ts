import { IAddControllerToElementOperationData } from '../../operation/add-controller-to-element';
import { IOperationMetadata } from './types';

function addControllerToElement(): IOperationMetadata<
  IAddControllerToElementOperationData
> {
  return {
    description: 'Adds the current controller to the selected element(s)',
    dependentProperties: ['selectedElement', 'controllerInstance'],
  };
}
export default addControllerToElement;
