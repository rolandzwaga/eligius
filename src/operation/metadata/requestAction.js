import ParameterTypes from "./ParameterTypes";

function requestAction() {
    return {
        systemName: {
            type: ParameterTypes.ACTION_NAME
        }
    };
}
export default requestAction;