/// <reference types="jquery" />
import { TOperation } from '../action/types';
export interface ICreateElementOperationData {
    elementName: string;
    attributes: any;
    text: string;
    template: JQuery;
}
declare const createElement: TOperation<ICreateElementOperationData>;
export default createElement;
