import { TOperation } from '../action/types';
export interface IResizeActionOperationData {
    actionInstance: any;
    actionOperationData: any;
}
declare const resizeAction: TOperation<IResizeActionOperationData>;
export default resizeAction;
