import {internalResolve} from './helper/internal-resolve.ts';
import type {TOperation} from './types.ts';

export interface IAnimateOperationData {
  /**
   * @type=ParameterType:boolean
   * @erased
   */
  animationEasing?: string;
  /**
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @required
   * @erased
   */
  animationProperties: Record<string, unknown>;
  /**
   * @type=ParameterType:number
   * @required
   * @erased
   */
  animationDuration: JQuery.Duration;
}

/**
 * This operation animates the specified selected element with the given [jQuery animation](https://api.jquery.com/animate/) properties, duration and easing.
 * It resolves after the animation completes.
 *
 * @param operationData
 * @returns
 */
export const animate: TOperation<IAnimateOperationData, Omit<IAnimateOperationData, 'animationEasing'|'animationProperties'|'animationDuration'>> = (
  operationData: IAnimateOperationData
) => {
  const {
    selectedElement,
    animationEasing,
    animationProperties,
    animationDuration,
  } = operationData;

  delete (operationData as any).animationEasing;
  delete (operationData as any).animationProperties;
  delete (operationData as any).animationDuration;

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
