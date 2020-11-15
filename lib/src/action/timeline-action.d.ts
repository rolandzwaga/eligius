import { IResolvedOperation } from '~/configuration/types';
import { IEventbus } from '~/eventbus/types';
import { TOperationData } from '~/operation/types';
import { IStrictDuration } from '~/types';
import { EndableAction } from './endable-action';
export declare class TimelineAction extends EndableAction {
    duration: IStrictDuration;
    active: boolean;
    constructor(name: string, startOperations: IResolvedOperation[], endOperations: IResolvedOperation[], duration: IStrictDuration, eventBus: IEventbus);
    start(initOperationData: TOperationData): Promise<TOperationData>;
    end(initOperationData: TOperationData): Promise<TOperationData>;
}
