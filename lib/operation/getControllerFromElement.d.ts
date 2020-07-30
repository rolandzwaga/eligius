/// <reference types="jquery" />
import { TOperation } from '../action/types';
export interface IGetControllerFromElementOperationData {
    selectedElement: JQuery;
    controllerName: string;
    controllerInstance: any;
}
declare const getControllerFromElement: TOperation<IGetControllerFromElementOperationData>;
export default getControllerFromElement;
