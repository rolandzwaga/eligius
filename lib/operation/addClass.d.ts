/// <reference types="jquery" />
import { TOperation } from '../action/types';
export interface IAddClassOperationData {
    selectedElement: JQuery;
    className: string;
}
declare const addClass: TOperation<IAddClassOperationData>;
export default addClass;
