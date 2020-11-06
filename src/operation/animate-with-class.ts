import { TOperation } from '../action/types';
import internalResolve from './helper/internal-resolve';

export interface IAnimateWithClassOperationData {
  selectedElement: JQuery;
  className: string;
  removeClass?: boolean;
}

const animateWithClass: TOperation<IAnimateWithClassOperationData> = function (operationData, _eventBus) {
  let { selectedElement, className, removeClass } = operationData;
  removeClass = removeClass !== undefined ? removeClass : true;

  const promise = new Promise<IAnimateWithClassOperationData>((resolve, reject) => {
    try {
      selectedElement.one('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationEnd', () => {
        if (removeClass) {
          selectedElement.removeClass(className);
        }
        internalResolve(resolve, {}, operationData);
      });
    } catch (e) {
      reject(e);
    }
  });

  selectedElement.addClass(className);

  return promise;
};

export default animateWithClass;
