/// <reference types="jquery" />
import { TOperation } from '../action/types';
export interface IRemoveControllerFromElementOperationData {
    selectedElement: JQuery;
    controllerName: string;
}
declare const removeControllerFromElement: TOperation<IRemoveControllerFromElementOperationData>;
export default removeControllerFromElement;
