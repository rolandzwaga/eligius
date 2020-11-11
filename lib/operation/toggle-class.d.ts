/// <reference types="jquery" />
import { TOperation } from './types';
export interface IToggleClassOperationData {
    selectedElement: JQuery;
    className: string;
}
export declare const toggleClass: TOperation<IToggleClassOperationData>;
