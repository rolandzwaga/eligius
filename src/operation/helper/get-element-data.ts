import { IController } from '../../controllers/types';

export const controllersDataName = 'eligiusEngineControllers';

function getElementData(name: string, element: JQuery): IController<any>[] {
  return element.data(name);
}

const getElementControllers = getElementData.bind(null, controllersDataName);

export { getElementData, getElementControllers };

