/// <reference types="jquery" />
import { TOperation } from './types';
export interface IRemoveControllerFromElementOperationData {
    selectedElement: JQuery;
    controllerName: string;
}
export declare const removeControllerFromElement: TOperation<IRemoveControllerFromElementOperationData>;
