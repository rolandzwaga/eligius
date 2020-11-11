/// <reference types="jquery" />
import { TOperation } from './types';
export interface IToggleElementOperationData {
    selectedElement: JQuery;
}
export declare const toggleElement: TOperation<IToggleElementOperationData>;
