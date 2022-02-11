import { internalResolve } from './helper/internal-resolve';
import { TOperation } from './types';

export interface IAnimateOperationData {
  animationEasing?: string;
  selectedElement: JQuery;
  animationProperties: any;
  animationDuration: number;
}

/**
 * This operation animates the specified selected element with the given jQuery animation settings.
 * It resolves after the animation completes.
 *
 * @param operationData
 * @returns
 */
export const animate: TOperation<IAnimateOperationData> = function (
  operationData: IAnimateOperationData
) {
  const {
    animationEasing,
    selectedElement,
    animationProperties,
    animationDuration,
  } = operationData;
  const promise = new Promise<IAnimateOperationData>((resolve, reject) => {
    try {
      if (animationEasing) {
        selectedElement.animate(
          animationProperties,
          animationDuration,
          animationEasing,
          () => {
            internalResolve(resolve, {}, operationData);
          }
        );
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
