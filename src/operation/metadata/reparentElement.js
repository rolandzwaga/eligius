import ParameterTypes from "./parameterTypes";

function reparentElement() {
    return {
        newParentSelector: {
            type: ParameterTypes.SELECTOR,
            required: true
        }
    };
}
export default reparentElement;