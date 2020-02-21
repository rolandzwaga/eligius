import ParameterTypes from './ParameterTypes';

function loadJSON() {
  return {
    description: 'Load JSON from the given url',
    properties: {
      url: {
        type: ParameterTypes.URL,
        required: true,
      },
      cache: ParameterTypes.BOOLEAN,
      propertyName: ParameterTypes.STRING,
    },
    outputProprties: ['json'],
  };
}
export default loadJSON;
