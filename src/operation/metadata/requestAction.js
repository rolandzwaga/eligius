import ParameterTypes from "./parameterTypes";

function requestAction() {
    return {
        systemName: {
            type: ParameterTypes.ACTION_NAME
        }
    };
}
export default requestAction;