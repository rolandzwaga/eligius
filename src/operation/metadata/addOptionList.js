import ParameterTypes from './ParameterTypes';

function addOptionList() {
  return {
    description:
      'Creates a list of option elements from the specified data and adds it to the currently selected element.',
    dependentProperties: ['selectedElement'],
    valueProperty: {
      type: ParameterTypes.STRING,
      required: true,
    },
    labelProperty: {
      type: ParameterTypes.STRING,
      required: true,
    },
    defaultIndex: {
      type: ParameterTypes.INTEGER,
    },
    defaultValue: {
      type: ParameterTypes.STRING,
    },
    optionData: {
      type: ParameterTypes.OBJECT,
    },
  };
}
export default addOptionList;
