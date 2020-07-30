/// <reference types="jquery" />
import { TOperation } from '../action/types';
export interface IToggleElementOperationData {
    selectedElement: JQuery;
}
declare const toggleElement: TOperation<IToggleElementOperationData>;
export default toggleElement;
