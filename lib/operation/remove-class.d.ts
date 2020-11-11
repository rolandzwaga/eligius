/// <reference types="jquery" />
import { TOperation } from './types';
export interface IRemoveClassOperationData {
    selectedElement: JQuery;
    className: string;
}
export declare const removeClass: TOperation<IRemoveClassOperationData>;
