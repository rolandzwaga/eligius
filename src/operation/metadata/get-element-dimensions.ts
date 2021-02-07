import { IGetElementDimensionsOperationData } from '../../operation/get-element-dimensions';
import { IOperationMetadata } from './types';

function getElementDimensions(): IOperationMetadata<IGetElementDimensionsOperationData> {
  return {
    description: 'Calculates the dimensions for the current element',
    dependentProperties: ['selectedElement'],
    properties: {
      modifier: 'ParameterType:dimensionsModifier',
    },
    outputProperties: {
      dimensions: 'ParameterType:dimensions',
    },
  };
}
export default getElementDimensions;
