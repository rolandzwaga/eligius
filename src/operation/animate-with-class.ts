import { internalResolve } from './helper/internal-resolve';
import { TOperation } from './types';

export interface IAnimateWithClassOperationData {
  selectedElement: JQuery;
  className: string;
  removeClass?: boolean;
}

export const animateWithClass: TOperation<IAnimateWithClassOperationData> = function(
  operationData: IAnimateWithClassOperationData
) {
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
