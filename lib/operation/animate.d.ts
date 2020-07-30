/// <reference types="jquery" />
import { TOperation } from '../action/types';
export interface IAnimateOperationData {
    animationEasing: string;
    selectedElement: JQuery;
    animationProperties: any;
    animationDuration: number;
}
declare const animate: TOperation<IAnimateOperationData>;
export default animate;
