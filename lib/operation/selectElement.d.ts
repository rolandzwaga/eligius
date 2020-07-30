import { TOperation } from '../action/types';
export interface ISelectElementOperationData {
    selector: string;
    propertyName: string;
    useSelectedElementAsRoot: boolean;
}
declare const selectElement: TOperation<ISelectElementOperationData>;
export default selectElement;
