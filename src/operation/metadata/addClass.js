import ParameterTypes from "./ParameterTypes";

function addClass() {
    return {
        className: {
            type: ParameterTypes.CLASS_NAME,
            requires: true
        }
    };
}
export default addClass;