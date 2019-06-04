import ParameterTypes from "./parameterTypes";

function endAction() {
    return {
        actionOperationData: {
            type: ParameterTypes.OBJECT
        }
    };
}
export default endAction;