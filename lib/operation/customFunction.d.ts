import { TOperation } from '../action/types';
export interface ICustomFunctionOperationData {
    systemName: string;
}
declare const customFunction: TOperation<ICustomFunctionOperationData>;
export default customFunction;
