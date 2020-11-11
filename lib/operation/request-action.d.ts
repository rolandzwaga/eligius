import { IAction } from '../action/types';
import { TOperation } from './types';
export interface IRequestActionOperationData {
    systemName: string;
    actionInstance: IAction;
}
export declare const requestAction: TOperation<IRequestActionOperationData>;
