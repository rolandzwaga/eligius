import ParameterTypes from "./ParameterTypes";

function reparentElement() {
    return {
        newParentSelector: {
            type: ParameterTypes.SELECTOR,
            required: true
        }
    };
}
export default reparentElement;