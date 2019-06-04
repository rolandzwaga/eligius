import ParameterTypes from "./parameterTypes";

function getControllerFromElement() {
    return {
        controllerName: ParameterTypes.CONTROLLER_NAME,
        required: true
    };
}
export default getControllerFromElement;