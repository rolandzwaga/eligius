import { TOperation } from './types';
export interface IStartLoopOperationData {
    collection: any[];
    propertyName?: string;
}
export declare const startLoop: TOperation<IStartLoopOperationData>;
