/// <reference types="jquery" />
import { TOperation } from './types';
export interface ISetElementContentOperationData {
    append: boolean;
    selectedElement: JQuery;
    template: string;
}
export declare const setElementContent: TOperation<ISetElementContentOperationData>;
