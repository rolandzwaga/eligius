/// <reference types="jquery" />
import { TOperation } from '../action/types';
export interface IAddControllerToElementMetadata {
    selectedElement: JQuery;
    controllerInstance: any;
}
declare const addControllerToElement: TOperation<IAddControllerToElementMetadata>;
export default addControllerToElement;
