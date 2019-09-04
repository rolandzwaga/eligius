import ParameterTypes from "./ParameterTypes";

function wait() {
    return {
        milliseconds: {
            type: ParameterTypes.INTEGER,
            required: true
        }
    };
}
export default wait;