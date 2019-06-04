import ParameterTypes from "./parameterTypes";

function getElementDimensions() {
    return {
        dimensions: {
            type: ParameterTypes.DIMENSIONS
        },
        modifier: {
            type: ParameterTypes.DIMENSIONS_MODIFIER
        }
    };
}
export default getElementDimensions;