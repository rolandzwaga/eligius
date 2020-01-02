import ParameterTypes from "./ParameterTypes";

function startAction() {
    return {
        actionOperationData: {
            type: ParameterTypes.OBJECT,
            required: true
        }
    };
}
export default startAction;