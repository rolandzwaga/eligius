import ParameterTypes from "./ParameterTypes";

function setStyle() {
    return {
        properties: {
            type: ParameterTypes.OBJECT,
            required: true
        }
    };
}
export default setStyle;