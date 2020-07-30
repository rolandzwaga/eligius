/// <reference types="jquery" />
import { TOperation } from '../action/types';
export interface IRemoveElementOperationData {
    selectedElement: JQuery;
}
declare const removeElement: TOperation<IRemoveElementOperationData>;
export default removeElement;
