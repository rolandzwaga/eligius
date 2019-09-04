import ParameterTypes from "./ParameterTypes";

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