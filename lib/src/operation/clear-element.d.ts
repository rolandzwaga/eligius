/// <reference types="jquery" />
import { TOperation } from './types';
export interface IClearElementOperationData {
    selectedElement: JQuery;
}
export declare const clearElement: TOperation<IClearElementOperationData>;
