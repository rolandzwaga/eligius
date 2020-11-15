/// <reference types="jquery" />
import { TOperation } from './types';
export interface IAddOptionListOperationData {
    valueProperty: string;
    labelProperty: string;
    defaultIndex: number;
    defaultValue: string;
    optionData: any[];
    selectedElement: JQuery;
}
export declare const addOptionList: TOperation<IAddOptionListOperationData>;
