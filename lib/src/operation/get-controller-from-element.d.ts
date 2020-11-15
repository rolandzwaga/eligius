/// <reference types="jquery" />
import { IController } from '~/controllers/types';
import { TOperation } from './types';
export interface IGetControllerFromElementOperationData {
    selectedElement: JQuery;
    controllerName: string;
    controllerInstance?: IController<any>;
}
export declare const getControllerFromElement: TOperation<IGetControllerFromElementOperationData>;
