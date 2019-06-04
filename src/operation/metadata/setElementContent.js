import ParameterTypes from "./parameterTypes";

function setElementContent() {
    return {
        append: {
            type: ParameterTypes.BOOLEAN
        },
        template: {
            type: ParameterTypes.HTML_CONTENT,
            required: true
        }
    };
}
export default setElementContent;