/// <reference types="jquery" />
import { TOperation } from '../action/types';
export interface IClearElementOperationData {
    selectedElement: JQuery;
}
declare const clearElement: TOperation<IClearElementOperationData>;
export default clearElement;
