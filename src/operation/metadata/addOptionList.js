import ParameterTypes from "./ParameterTypes";

function addOptionList() {
    return {
        valueProperty: {
            type: ParameterTypes.STRING,
            required: true
        },
        labelProperty: {
            type: ParameterTypes.STRING,
            required: true
        },
        defaultIndex: {
            type: ParameterTypes.INTEGER,
        },
        defaultValue: {
            type: ParameterTypes.STRING,
        },
        optionData: {
            type: ParameterTypes.OBJECT
        }
    };
}
export default addOptionList;