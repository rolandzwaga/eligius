import { ICreateElementOperationData } from '../createElement';
import { IOperationMetadata } from './types';

function createElement(): IOperationMetadata<ICreateElementOperationData> {
  return {
    description: 'Creates an HTML element with the given name and optionally adds the given attributes',
    properties: {
      elementName: {
        type: 'ParameterType:htmlElementName',
        required: true,
      },
      attributes: 'ParameterType:object',
      text: 'ParameterType:string',
    },
    outputProperties: {
      template: 'ParameterType:object',
    },
  };
}
export default createElement;
