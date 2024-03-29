import { internalResolve } from './helper/internal-resolve';
import { TOperation } from './types';

export interface IAnimateWithClassOperationData {
  selectedElement: JQuery;
  className: string;
  removeClass?: boolean;
}

/**
 * This operation adds the specified class name to the specified selected element and assumes that this
 * class triggers and animation on the selected element. It then waits for this animation to complete
 * before it resolves.
 *
 * @param operationData
 * @returns
 */
export const animateWithClass: TOperation<IAnimateWithClassOperationData> =
  function (operationData: IAnimateWithClassOperationData) {
    let { selectedElement, className, removeClass } = operationData;
    removeClass = removeClass !== undefined ? removeClass : true;

    const promise = new Promise<IAnimateWithClassOperationData>(
      (resolve, reject) => {
        try {
          selectedElement.one(
            'webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationEnd',
            () => {
              if (removeClass) {
                selectedElement.removeClass(className);
              }
              internalResolve(resolve, {}, operationData);
            }
          );
        } catch (e) {
          reject(e);
        }
      }
    );

    selectedElement.addClass(className);

    return promise;
  };
