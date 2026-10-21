import {internalResolve} from '@operation/helper/internal-resolve.ts';
import {removeProperties} from '@operation/helper/remove-operation-properties.ts';
import type {TOperation} from '@operation/types.ts';

export interface IAnimateWithClassOperationData {
  /**
   * @dependency
   */
  selectedElement: JQuery;
  /**
   * @type=ParameterType:className
   * @required
   * @erased
   */
  className: string;
  /**
   * When true (the default), the class is removed again after the animation ends
   *
   * @erased
   */
  removeClass?: boolean;
}

/**
 * This operation adds the specified class name to the specified selected element and assumes that this
 * class triggers and animation on the selected element. It then waits for this animation to complete
 * before it resolves.
 *
 * @category Animation
 */
export const animateWithClass: TOperation<
  IAnimateWithClassOperationData,
  Omit<IAnimateWithClassOperationData, 'className' | 'removeClass'>
> = (operationData: IAnimateWithClassOperationData) => {
  const {selectedElement, className} = operationData;
  const removeClass = operationData.removeClass ?? true;

  removeProperties(operationData, 'className', 'removeClass');

  const promise = new Promise<
    Omit<IAnimateWithClassOperationData, 'className' | 'removeClass'>
  >((resolve, reject) => {
    try {
      const handleAnimationEnd = () => {
        selectedElement.off('animationend', handleAnimationEnd);
        if (removeClass) {
          selectedElement.removeClass(className);
        }
        internalResolve(resolve, {}, operationData);
      };
      selectedElement.on('animationend', handleAnimationEnd);
    } catch (e) {
      reject(e);
    }
  });

  selectedElement.addClass(className);

  return promise;
};
