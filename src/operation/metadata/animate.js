import ParameterTypes from "./parameterTypes";

function animate() {
    return {
        animationEasing: {
            type: ParameterTypes.BOOLEAN
        },
        animationProperties: {
            type: ParameterTypes.OBJECT,
            required: true
        },
        animationDuration: {
            type: ParameterTypes.INTEGER,
            required: true
        }
    };
}
export default animate;