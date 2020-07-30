import ParameterTypes from './ParameterTypes';
import { IOperationMetadata } from './types';

function loadJSON(): IOperationMetadata {
  return {
    description: 'Load JSON from the given url',
    properties: {
      url: {
        type: ParameterTypes.URL,
        required: true,
      },
      cache: ParameterTypes.BOOLEAN,
      propertyName: {
        type: ParameterTypes.STRING,
        defaultValue: 'json',
      },
    },
    outputProperties: ['json'],
  };
}
export default loadJSON;
