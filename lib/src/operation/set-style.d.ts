/// <reference types="jquery" />
import { TOperation } from './types';
export interface ISetStyleOperationData {
    properties: any;
    propertyName?: string;
    selectedElement?: JQuery;
}
export declare const setStyle: TOperation<ISetStyleOperationData>;
