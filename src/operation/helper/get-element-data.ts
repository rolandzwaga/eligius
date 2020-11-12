import { IController } from '~/controllers/types';

const controllersName = 'chronoEngineControllers';

function getElementData(name: string, element: JQuery): IController<any>[] {
  return element.data(name);
}

const getElementControllers = getElementData.bind(null, controllersName);

export { getElementData, getElementControllers };
