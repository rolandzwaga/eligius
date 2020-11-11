/// <reference types="jquery" />
import { TOperation } from './types';
export interface IGetControllerFromElementOperationData {
    selectedElement: JQuery;
    controllerName: string;
    controllerInstance: any;
}
export declare const getControllerFromElement: TOperation<IGetControllerFromElementOperationData>;
