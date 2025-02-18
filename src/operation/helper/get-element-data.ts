import type { IController } from '../../controllers/types.ts';

const controllersDataName = 'eligiusEngineControllers';

function getElementData(name: string, element: JQuery): IController<any>[] | undefined {
  return element.data(name);
}

const getElementControllers = getElementData.bind(null, controllersDataName);

export { getElementData, getElementControllers, controllersDataName };

