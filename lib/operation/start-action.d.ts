import { IAction } from '../action/types';
import { TOperation } from './types';
export interface IStartActionOperationData {
    actionInstance: IAction;
    actionOperationData: any;
}
export declare const startAction: TOperation<IStartActionOperationData>;
