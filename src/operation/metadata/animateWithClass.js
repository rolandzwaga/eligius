import ParameterTypes from "./parameterTypes";

function animateWithClass() {
    return {
        className: {
            type: ParameterTypes.CLASS_NAME,
            required: true
        },
        removeClass: {
            type: ParameterTypes.BOOLEAN
        }
    };
}
export default animateWithClass;