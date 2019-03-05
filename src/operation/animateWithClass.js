import internalResolve from './helper/internalResolve';

function animateWithClass(operationData, eventBus) {
    const {selectedElement, className} = operationData;

    const promise = new Promise((resolve, reject)=> {
        try{
            selectedElement.one("webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationEnd",
            () => {
                selectedElement.removeClass(className);
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
