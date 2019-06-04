import ParameterTypes from "./parameterTypes";

function toggleClass() {
    return {
        className: {
            type: ParameterTypes.CLASS_NAME,
            required: true
        }
    };
}
export default toggleClass;