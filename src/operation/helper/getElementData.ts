const controllersName = 'chronoEngineControllers';

function getElementData(name: string, element: JQuery) {
  return element.data(name);
}

const getElementControllers = getElementData.bind(null, controllersName);

export { getElementData, getElementControllers };
