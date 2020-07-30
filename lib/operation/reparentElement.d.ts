/// <reference types="jquery" />
import { TOperation } from '../action/types';
export interface IReparentElementOperationData {
    selectedElement: JQuery;
    newParentSelector: string;
}
declare const reparentElement: TOperation<IReparentElementOperationData>;
export default reparentElement;
