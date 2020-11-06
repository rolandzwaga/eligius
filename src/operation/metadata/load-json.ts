import { ILoadJSONOperationData } from '../load-json';
import { IOperationMetadata } from './types';

function loadJSON(): IOperationMetadata<ILoadJSONOperationData> {
  return {
    description: 'Load JSON from the given url',
    properties: {
      url: {
        type: 'ParameterType:url',
        required: true,
      },
      cache: 'ParameterType:boolean',
      propertyName: {
        type: 'ParameterType:string',
        defaultValue: 'json',
      },
    },
    outputProperties: {
      json: 'ParameterType:object',
    },
  };
}
export default loadJSON;
