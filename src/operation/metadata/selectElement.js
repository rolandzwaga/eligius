import ParameterTypes from "./ParameterTypes";

function selectElement() {
    return {
        selector: {
            type: ParameterTypes.SELECTOR,
            required: true
        },
        propertyName: {
            type: ParameterTypes.STRING
        },
        useSelectedElementAsRoot: {
            type: ParameterTypes.BOOLEAN
        }
    };
}
export default selectElement;