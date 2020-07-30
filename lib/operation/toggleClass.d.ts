/// <reference types="jquery" />
import { TOperation } from '../action/types';
export interface IToggleClassOperationData {
    selectedElement: JQuery;
    className: string;
}
declare const toggleClass: TOperation<IToggleClassOperationData>;
export default toggleClass;
