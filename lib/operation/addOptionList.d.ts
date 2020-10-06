/// <reference types="jquery" />
import { TOperation } from '../action/types';
export interface IAddOptionListOperationData {
    valueProperty: string;
    labelProperty: string;
    defaultIndex: number;
    defaultValue: string;
    optionData: any[];
    selectedElement: JQuery;
}
declare const addOptionList: TOperation<IAddOptionListOperationData>;
export default addOptionList;
