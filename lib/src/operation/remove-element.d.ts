/// <reference types="jquery" />
import { TOperation } from './types';
export interface IRemoveElementOperationData {
    selectedElement: JQuery;
}
export declare const removeElement: TOperation<IRemoveElementOperationData>;
