import { IAction, TOperation } from '../action/types';
export interface IStartActionOperationData {
    actionInstance: IAction;
    actionOperationData: any;
}
declare const startAction: TOperation<IStartActionOperationData>;
export default startAction;
