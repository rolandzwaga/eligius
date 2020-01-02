import getGlobals from './helper/getGlobals';

function addGlobalsToOperation(operationData, eventBus) {
    const { globalProperties } = operationData;
    const globalValues = globalProperties.reduce((prev, current) => {
        prev[current] = getGlobals(current);
        return prev;
    }, {});
    delete operationData.globalProperties;
    return Object.assign(operationData, globalValues);
}

export default addGlobalsToOperation;
