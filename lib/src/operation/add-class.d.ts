/// <reference types="jquery" />
import { TOperation } from './types';
export interface IAddClassOperationData {
    selectedElement: JQuery;
    className: string;
}
export declare const addClass: TOperation<IAddClassOperationData>;
