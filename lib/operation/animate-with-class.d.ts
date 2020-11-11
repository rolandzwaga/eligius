/// <reference types="jquery" />
import { TOperation } from './types';
export interface IAnimateWithClassOperationData {
    selectedElement: JQuery;
    className: string;
    removeClass?: boolean;
}
export declare const animateWithClass: TOperation<IAnimateWithClassOperationData>;
