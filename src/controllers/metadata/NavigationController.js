import ParameterTypes from '../../operation/metadata/ParameterTypes';

function NavigationController() {
    return {
        json: {
            type: ParameterTypes.OBJECT,
            required: true
        }
    }
}

export default NavigationController;