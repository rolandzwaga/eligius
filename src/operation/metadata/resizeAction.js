import ParameterTypes from "./parameterTypes";

function resizeAction() {
    return {
        actionOperationData: {
            type: ParameterTypes.OBJECT
        }
    };
}
export default resizeAction;