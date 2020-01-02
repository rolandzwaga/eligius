import ParameterTypes from "./ParameterTypes";

function getControllerFromElement() {
    return {
        controllerName: ParameterTypes.CONTROLLER_NAME,
        required: true
    };
}
export default getControllerFromElement;