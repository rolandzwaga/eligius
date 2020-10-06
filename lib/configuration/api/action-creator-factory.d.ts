import { IActionConfiguration, IEndableActionConfiguration, ITimelineActionConfiguration, TOperationData } from '../../action/types';
import ConfigurationFactory from './configuration-factory';
export declare class ActionCreatorFactory {
    private readonly configurationfactory;
    constructor(configurationfactory: ConfigurationFactory);
    createAction(name: string): ActionCreator;
    createInitAction(name: string): EndableActionCreator;
    createEventAction(name: string): ActionCreator;
    createTimelineAction(uri: string, name: string): TimelineActionCreator;
    end(): ConfigurationFactory;
}
export declare class ActionCreator<T extends IActionConfiguration = IActionConfiguration> {
    private readonly factory;
    actionConfig: T;
    constructor(name: string | undefined, factory: ActionCreatorFactory);
    getId(): string;
    setName(name: string): this;
    getConfiguration(callBack: (config: T) => T): this;
    addStartOperation(systemName: string, operationData: TOperationData): this;
    next(): ActionCreatorFactory;
}
export declare class EndableActionCreator<T extends IEndableActionConfiguration = IEndableActionConfiguration> extends ActionCreator<T> {
    addEndOperation(systemName: string, operationData: TOperationData): this;
}
export declare class TimelineActionCreator extends EndableActionCreator<ITimelineActionConfiguration> {
    addDuration(start: number, end?: number): this;
}
