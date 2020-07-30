import { TOperation } from '../action/types';
export interface IWaitOperationData {
    milliseconds: number;
}
declare const wait: TOperation<IWaitOperationData>;
export default wait;
