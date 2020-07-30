/// <reference types="jquery" />
import { TOperation } from '../action/types';
export interface ISetElementAttributesOperationData {
    attributes: any;
    selectedElement: JQuery;
}
declare const setElementAttributes: TOperation<ISetElementAttributesOperationData>;
export default setElementAttributes;
