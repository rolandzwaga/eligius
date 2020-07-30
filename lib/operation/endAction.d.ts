import { IEndableAction, TOperation } from '../action/types';
export interface IEndActionOperationData {
    actionInstance: IEndableAction;
    actionOperationData: any;
}
declare const endAction: TOperation<IEndActionOperationData>;
export default endAction;
