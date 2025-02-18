import type { ISubtitlesControllerOperationData } from '../subtitles-controller.ts';
import type { IControllerMetadata } from './types.ts';

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
