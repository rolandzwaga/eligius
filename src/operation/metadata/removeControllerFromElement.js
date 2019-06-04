import ParameterTypes from "./parameterTypes";

function removeControllerFromElement() {
    return {
        controllerName: {
            type: ParameterTypes.CONTROLLER_NAME,
            required: true
        }
    };
}
export default removeControllerFromElement;