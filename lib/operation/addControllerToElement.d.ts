/// <reference types="jquery" />
import { TOperation } from '../action/types';
import { IController } from '../controllers/types';
export interface IAddControllerToElementOperationData {
    selectedElement: JQuery;
    controllerInstance: IController<any>;
}
declare const addControllerToElement: TOperation<IAddControllerToElementOperationData>;
export default addControllerToElement;
