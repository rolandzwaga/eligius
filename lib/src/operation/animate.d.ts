/// <reference types="jquery" />
import { TOperation } from './types';
export interface IAnimateOperationData {
    animationEasing?: string;
    selectedElement: JQuery;
    animationProperties: any;
    animationDuration: number;
}
export declare const animate: TOperation<IAnimateOperationData>;
