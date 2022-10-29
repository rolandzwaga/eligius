import { ILoadJSONOperationData } from '../../operation/load-json';
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
    },
    outputProperties: {
      json: 'ParameterType:object',
    },
  };
}
export default loadJSON;
