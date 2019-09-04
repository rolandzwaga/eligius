import ParameterTypes from "./ParameterTypes";

function getImport() {
    return {
        systemName: {
            type: ParameterTypes.SYSTEM_NAME,
            required: true
        }
    };
}
export default getImport;