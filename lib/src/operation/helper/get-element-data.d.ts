/// <reference types="jquery" />
import { IController } from '~/controllers/types';
declare function getElementData(name: string, element: JQuery): IController<any>[];
declare const getElementControllers: (element: JQuery<HTMLElement>) => IController<any>[];
export { getElementData, getElementControllers };
