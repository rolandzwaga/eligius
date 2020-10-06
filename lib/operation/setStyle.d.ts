/// <reference types="jquery" />
import { TOperation } from '../action/types';
export interface ISetStyleOperationData {
    properties: any;
    propertyName?: string;
    selectedElement?: JQuery;
}
declare const setStyle: TOperation<ISetStyleOperationData>;
export default setStyle;
