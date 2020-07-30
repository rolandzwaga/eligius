/// <reference types="jquery" />
import { TOperation } from '../action/types';
export interface IRemoveClassOperationData {
    selectedElement: JQuery;
    className: string;
}
declare const removeClass: TOperation<IRemoveClassOperationData>;
export default removeClass;
