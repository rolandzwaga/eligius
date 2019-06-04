import ParameterTypes from "./parameterTypes";

function removeClass() {
    return {
        className: {
            type: ParameterTypes.CLASS_NAME,
            required: true
        }
    };
}
export default removeClass;