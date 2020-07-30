import internalResolve from './helper/internalResolve';
import { TOperation } from '../action/types';

export interface IAnimateOperationData {
  animationEasing: string;
  selectedElement: JQuery;
  animationProperties: any;
  animationDuration: number;
}

const animate: TOperation<IAnimateOperationData> = function (operationData, _eventBus) {
  const { animationEasing, selectedElement, animationProperties, animationDuration } = operationData;
  const promise = new Promise<IAnimateOperationData>((resolve, reject) => {
    try {
      if (animationEasing) {
        selectedElement.animate(animationProperties, animationDuration, animationEasing, () => {
          internalResolve(resolve, {}, operationData);
        });
      } else {
        selectedElement.animate(animationProperties, animationDuration, () => {
          internalResolve(resolve, {}, operationData);
        });
      }
    } catch (e) {
      reject(e);
    }
  });
  return promise;
};

export default animate;
