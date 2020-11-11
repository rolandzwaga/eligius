import { TOperation } from './types';
export interface ISelectElementOperationData {
    selector: string;
    propertyName: string;
    useSelectedElementAsRoot: boolean;
}
export declare const selectElement: TOperation<ISelectElementOperationData>;
