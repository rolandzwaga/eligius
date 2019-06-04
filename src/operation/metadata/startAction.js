import ParameterTypes from "./parameterTypes";

function startAction() {
    return {
        actionOperationData: {
            type: ParameterTypes.OBJECT,
            required: true
        }
    };
}
export default startAction;