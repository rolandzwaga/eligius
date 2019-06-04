import ParameterTypes from "./parameterTypes";

function setStyle() {
    return {
        properties: {
            type: ParameterTypes.OBJECT,
            required: true
        }
    };
}
export default setStyle;