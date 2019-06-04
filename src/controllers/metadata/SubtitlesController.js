import ParameterTypes from '../../operation/metadata/ParameterTypes';

function SubtitlesController() {
    return {
        subtitleData: {
            type: ParameterTypes.OBJECT
        }
    };
}

export default SubtitlesController;
