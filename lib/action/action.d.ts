import { IAction, TOperationData, IOperationInfo, IResolvedActionConfiguration, TActionContext } from './types';
import { IEventbus } from '../eventbus/types';
declare class Action implements IAction {
    private eventbus;
    name: string;
    startOperations: IOperationInfo[];
    constructor(actionConfiguration: IResolvedActionConfiguration, eventbus: IEventbus);
    start(initOperationData?: TOperationData): Promise<TOperationData>;
    executeOperation(operations: IOperationInfo[], idx: number, resolve: (value?: any | PromiseLike<any>) => void, reject: (reason?: any) => void, previousOperationData: TOperationData | undefined, context: TActionContext): void;
}
export default Action;
