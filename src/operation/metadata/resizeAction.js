import ParameterTypes from "./ParameterTypes";

function resizeAction() {
    return {
        actionOperationData: {
            type: ParameterTypes.OBJECT
        }
    };
}
export default resizeAction;