import { IResolvedOperation } from '~/configuration/types';
import { IEventbus } from '~/eventbus/types';
import { TOperationData } from '~/operation/types';
import { Action } from './action';
export declare class EndableAction extends Action {
    endOperations: IResolvedOperation[];
    constructor(name: string, startOperations: IResolvedOperation[], endOperations: IResolvedOperation[], eventBus: IEventbus);
    end(initOperationData?: TOperationData): Promise<TOperationData>;
}
