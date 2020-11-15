import { IEventbus } from '~/eventbus/types';
export declare type TOperationResult<T = TOperationData> = Promise<T> | T;
export interface IOperationContext {
    loopIndex?: number;
    loopLength?: number;
    startIndex?: number;
    newIndex?: number;
    currentIndex: number;
    skipNextOperation?: boolean;
}
export declare type TOperation<T = TOperationData> = (operationData: T, eventbus: IEventbus) => TOperationResult<T>;
export declare type TOperationData = any;
