import { IGetAttributesFromElementOperationData } from '../get-attributes-from-element';
import { IOperationMetadata } from './types';

function getAttributesFromElement(): IOperationMetadata<IGetAttributesFromElementOperationData> {
  return {
    description:
      'Retrieves the values for the specified attribute names from  the given selected element.',
    dependentProperties: ['selectedElement'],
    properties: {
      attributeNames: {
        type: 'ParameterType:array',
        itemType: 'ParameterType:string',
        required: true,
      },
    },
    outputProperties: {
      attributeValues: 'ParameterType:object',
    },
  };
}
export default getAttributesFromElement;
