import ParameterTypes from "./parameterTypes";

function loadJSON() {
    return {
        url: {
            type: ParameterTypes.URL,
            required: true
        },
        cache: {
            type: ParameterTypes.BOOLEAN
        },
        propertyName: {
            type: ParameterTypes.STRING
        }
    };
}
export default loadJSON;