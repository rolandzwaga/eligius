import ParameterTypes from "./parameterTypes";

function wait() {
    return {
        milliseconds: {
            type: ParameterTypes.INTEGER,
            required: true
        }
    };
}
export default wait;