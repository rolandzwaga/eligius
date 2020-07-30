/// <reference types="jquery" />
import { TOperation } from '../action/types';
export interface ISetElementContentOperationData {
    append: boolean;
    selectedElement: JQuery;
    template: string;
}
declare const setElementContent: TOperation<ISetElementContentOperationData>;
export default setElementContent;
