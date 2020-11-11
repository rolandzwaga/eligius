import { TOperation } from './types';
export interface IWaitOperationData {
    milliseconds: number;
}
export declare const wait: TOperation<IWaitOperationData>;
