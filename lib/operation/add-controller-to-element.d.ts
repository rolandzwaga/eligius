/// <reference types="jquery" />
import { IController } from '../controllers/types';
import { TOperation } from './types';
export interface IAddControllerToElementOperationData {
    selectedElement: JQuery;
    controllerInstance: IController<any>;
}
export declare const addControllerToElement: TOperation<IAddControllerToElementOperationData>;
