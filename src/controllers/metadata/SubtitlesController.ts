import { ISubtitlesControllerOperationData } from '../../controllers/subtitles-controller';
import { IControllerMetadata } from './types';

function SubtitlesController(): IControllerMetadata<ISubtitlesControllerOperationData> {
  return {
    description: 'SubtitlesController',
    dependentProperties: ['selectedElement'],
    properties: {
      subtitleData: 'ParameterType:object',
      language: 'ParameterType:string',
    },
  };
}

export default SubtitlesController;
