import ParameterTypes from "./ParameterTypes";

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