import { IEndableAction } from '../action/types';
import { TOperation } from './types';
export interface IEndActionOperationData {
    actionInstance: IEndableAction;
    actionOperationData: any;
}
export declare const endAction: TOperation<IEndActionOperationData>;
