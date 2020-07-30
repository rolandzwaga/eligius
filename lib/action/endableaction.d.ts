import Action from './action';
import { IOperationInfo, IResolvedEndableActionConfiguration, TOperationData } from './types';
import { IEventbus } from '../eventbus/types';
declare class EndableAction extends Action {
    endOperations: IOperationInfo[];
    constructor(actionConfiguration: IResolvedEndableActionConfiguration, eventBus: IEventbus);
    end(initOperationData?: TOperationData): Promise<TOperationData>;
}
export default EndableAction;
