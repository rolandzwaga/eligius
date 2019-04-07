function getElementData(name, element) {
    return element.data(name);
}

const getElementControllers = getElementData.bind(null, "chronoEngineControllers");

export {
    getElementData,
    getElementControllers
}