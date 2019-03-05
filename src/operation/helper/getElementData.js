function getElementData(name, element) {
    return element.data(name);
}

const getElementControllers = getElementData.bind(null, "ivpControllers");

export {
    getElementData,
    getElementControllers
}