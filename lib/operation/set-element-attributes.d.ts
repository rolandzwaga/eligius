/// <reference types="jquery" />
import { TOperation } from './types';
export interface ISetElementAttributesOperationData {
    attributes: any;
    selectedElement: JQuery;
}
export declare const setElementAttributes: TOperation<ISetElementAttributesOperationData>;
