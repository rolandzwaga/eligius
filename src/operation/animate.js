import internalResolve from './helper/internalResolve';

function animate(operationData, eventBus) {
    const {animationEasing, selectedElement, animationProperties, animationDuration} = operationData;
    const promise = new Promise((resolve, reject)=> {
        try{
            if (animationEasing) {
                selectedElement.animate(animationProperties,
                    animationDuration,
                    animationEasing,
                    () => {
                        internalResolve(resolve, {}, operationData);
                    });
            } else {
                selectedElement.animate(animationProperties,
                    animationDuration,
                    () => {
                        internalResolve(resolve, {}, operationData);
                    });
            }
        } catch(e){
            reject(e);
        }
    });
    return promise;
}

export default animate;
