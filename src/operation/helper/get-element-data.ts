import { IController } from '../../controllers/types';

const controllersName = 'eligiusEngineControllers';

function getElementData(name: string, element: JQuery): IController<any>[] {
  return element.data(name);
}

const getElementControllers = getElementData.bind(null, controllersName);

export { getElementData, getElementControllers };
