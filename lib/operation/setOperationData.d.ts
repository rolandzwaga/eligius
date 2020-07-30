import { TOperation } from '../action/types';
export interface ISetOperationData {
    override: boolean;
    properties: any;
}
declare const setOperationData: TOperation<ISetOperationData>;
export default setOperationData;
