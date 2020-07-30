/// <reference types="jquery" />
import { TOperation } from '../action/types';
export interface IAnimateWithClassOperationData {
    selectedElement: JQuery;
    className: string;
    removeClass?: boolean;
}
declare const animateWithClass: TOperation<IAnimateWithClassOperationData>;
export default animateWithClass;
