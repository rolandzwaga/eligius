import ParameterTypes from "./parameterTypes";

function addClass() {
    return {
        className: {
            type: ParameterTypes.CLASS_NAME,
            requires: true
        }
    };
}
export default addClass;