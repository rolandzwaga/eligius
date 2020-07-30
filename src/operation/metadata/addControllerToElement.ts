import { IOperationMetadata } from './types';
import { IAddControllerToElementOperationData } from '../addControllerToElement';

function addControllerToElement(): IOperationMetadata<IAddControllerToElementOperationData> {
  return {
    description: 'Adds the current controller to the selected element(s)',
    dependentProperties: ['selectedElement', 'controllerInstance'],
  };
}
export default addControllerToElement;
