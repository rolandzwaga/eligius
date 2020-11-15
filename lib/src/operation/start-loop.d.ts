import { TOperation } from './types';
export declare type TStartLoopOperationData = {
    collection: any[] | null;
    propertyName?: string;
};
export declare const startLoop: TOperation<TStartLoopOperationData>;
