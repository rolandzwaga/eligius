import { IResolvedOperation } from '../configuration/types';
import { IEventbus } from '../eventbus/types';
import { TActionContext, TOperationData } from '../operation/types';
import { IAction } from './types';
export declare class Action implements IAction {
    name: string;
    startOperations: IResolvedOperation[];
    private eventbus;
    id: string;
    constructor(name: string, startOperations: IResolvedOperation[], eventbus: IEventbus);
    start(initOperationData?: TOperationData): Promise<TOperationData>;
    executeOperation(operations: IResolvedOperation[], idx: number, resolve: (value?: any | PromiseLike<any>) => void, reject: (reason?: any) => void, previousOperationData: TOperationData | undefined, context: TActionContext): void;
}
