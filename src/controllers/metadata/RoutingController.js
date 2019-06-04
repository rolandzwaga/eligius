import ParameterTypes from '../../operation/metadata/ParameterTypes';

function RoutingController() {
    return {
        json: {
            type: ParameterTypes.OBJECT,
            required: true
        }
    }
}

export default RoutingController;
