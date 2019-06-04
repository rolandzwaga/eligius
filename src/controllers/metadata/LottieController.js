import ParameterTypes from '../../operation/metadata/ParameterTypes';

function LottieController() {
    return {
        renderer: {
            type: ParameterTypes.STRING
        },
        loop: {
            type: ParameterTypes.BOOLEAN
        },
        autoplay: {
            type: ParameterTypes.BOOLEAN
        },
        animationData: {
            type: ParameterTypes.OBJECT
        },
        json: {
            type: ParameterTypes.OBJECT
        },
        labelIds: {
            type: ParameterTypes.ARRAY,
            itemType: ParameterTypes.LABEL_ID
        },
        viewBox: {
            type: ParameterTypes.STRING
        },
        url: {
            type: ParameterTypes.URL,
            required: true
        },
        iefallback: {
            type: ParameterTypes.OBJECT
        }
    }
}

export default LottieController;
