import ParameterTypes from "./ParameterTypes";

function endAction() {
    return {
        actionOperationData: {
            type: ParameterTypes.OBJECT
        }
    };
}
export default endAction;