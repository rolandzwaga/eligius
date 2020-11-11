import { TOperation } from './types';
export interface IGetControllerInstanceOperationData {
    systemName: string;
    propertyName?: string;
}
export declare const getControllerInstance: TOperation<IGetControllerInstanceOperationData>;
