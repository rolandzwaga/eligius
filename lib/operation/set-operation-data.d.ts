import { TOperation } from './types';
export interface ISetOperationData {
    override: boolean;
    properties: any;
}
export declare const setOperationData: TOperation<ISetOperationData>;
