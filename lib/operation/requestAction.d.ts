import { TOperation } from '../action/types';
export interface IRequestActionOperationData {
    systemName: string;
    actionInstance: any;
}
declare const requestAction: TOperation<IRequestActionOperationData>;
export default requestAction;
