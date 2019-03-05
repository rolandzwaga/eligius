import $ from 'jquery';

function extendController(operationData, eventBus) {
    operationData.controllerInstance = $.extend(operationData.controllerInstance, operationData.controllerExtension, true);
    return operationData;
}

export default extendController;
