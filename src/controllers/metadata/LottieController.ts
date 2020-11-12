import { ILottieControllerMetadata } from '~/controllers/lottie-controller';
import { IControllerMetadata } from './types';

function LottieController(): IControllerMetadata<ILottieControllerMetadata> {
  return {
    description: 'LottieController',
    properties: {
      renderer: 'ParameterType:string',
      loop: 'ParameterType:boolean',
      autoplay: 'ParameterType:boolean',
      animationData: 'ParameterType:object',
      json: {
        type: 'ParameterType:object',
        required: true,
      },
      labelIds: {
        type: 'ParameterType:array',
        itemType: 'ParameterType:labelId',
      },
      viewBox: 'ParameterType:string',
      url: {
        type: 'ParameterType:url',
        required: true,
      },
      iefallback: 'ParameterType:object',
    },
  };
}

export default LottieController;
