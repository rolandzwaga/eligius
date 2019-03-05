function requestAction(operationData, eventBus) {
        const resultCallback = (action) => {
            operationData.actionInstance = action;
        };
        eventBus.broadcast("request-action", [operationData.actionName, resultCallback]);
        return operationData;
}

export default requestAction;
