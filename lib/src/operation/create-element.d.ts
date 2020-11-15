/// <reference types="jquery" />
import { TOperation } from './types';
export interface ICreateElementOperationData {
    elementName: string;
    attributes?: any;
    text: string;
    template: JQuery;
}
export declare const createElement: TOperation<ICreateElementOperationData>;
