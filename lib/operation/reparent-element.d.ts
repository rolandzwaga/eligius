/// <reference types="jquery" />
import { TOperation } from './types';
export interface IReparentElementOperationData {
    selectedElement: JQuery;
    newParentSelector: string;
}
export declare const reparentElement: TOperation<IReparentElementOperationData>;
