import { IActionConfiguration, IEndableActionConfiguration, IOperationConfiguration, ITimelineActionConfiguration } from '~/configuration/types';
import { TOperationData } from '~/operation/types';
import { ConfigurationFactory } from './configuration-factory';
export declare class ActionEditor<T extends IActionConfiguration = IActionConfiguration> {
    protected actionConfig: T;
    protected readonly configurationFactory: ConfigurationFactory;
    constructor(actionConfig: T, configurationFactory: ConfigurationFactory);
    updateConfiguration(): void;
    getConfiguration(callBack: (config: T) => T): this;
    setName(name: string): this;
    getName(): string;
    addStartOperation(systemName: string, operationData: TOperationData): OperationEditor<this>;
    editStartOperation(id: string): OperationEditor<ActionEditor<T>>;
    removeStartOperation(id: string): this;
    moveStartOperation(id: string, direction: 'up' | 'down'): this;
    next(): ConfigurationFactory;
}
export declare class EndableActionEditor<T extends IEndableActionConfiguration = IEndableActionConfiguration> extends ActionEditor<T> {
    addEndOperation(systemName: string, operationData: TOperationData): OperationEditor<this>;
    editEndOperation(id: string): OperationEditor<this>;
    removeEndOperation(id: string): this;
    moveEndOperation(id: string, direction: 'up' | 'down'): this;
}
export declare class TimelineActionEditor extends EndableActionEditor<ITimelineActionConfiguration> {
    setDuration(start: number, end?: number): this;
}
export declare class OperationEditor<T extends ActionEditor> {
    private operationConfig;
    private actionEditor;
    constructor(operationConfig: IOperationConfiguration, actionEditor: T);
    getConfiguration(callBack: (config: IOperationConfiguration) => IOperationConfiguration): this;
    getSystemName(): string;
    setSystemName(systemName: string): this;
    setOperationData(operationData: TOperationData): this;
    setOperationDataItem(key: string, value: any): this;
    getOperationDataKeys(): string[];
    getOperationDataValue(key: string): any;
    next(): T;
}
