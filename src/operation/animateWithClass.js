import internalResolve from './helper/internalResolve';

function animateWithClass(operationData, eventBus) {
    let {selectedElement, className, removeClass } = operationData;
    removeClass = (removeClass !== undefined) ? removeClass : true;

    const promise = new Promise((resolve, reject)=> {
        try{
            selectedElement.one("webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationEnd",
            () => {
                if (removeClass) {
                    selectedElement.removeClass(className);
                }
                internalResolve(resolve, {}, operationData);
            });
        } catch(e){
            reject(e);
        }
    });

    selectedElement.addClass(className);

    return promise;
}

export default animateWithClass;
