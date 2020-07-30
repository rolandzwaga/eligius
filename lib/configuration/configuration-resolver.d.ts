import { IConfigurationResolver, IResourceImporter, IEngineConfiguration, ITimelineConfiguration, IResolvedEngineConfiguration } from '../types';
import { IEventbus } from '../eventbus/types';
import { IAction } from '../action/types';
import { ActionRegistryEventbusListener } from '../eventbus';
declare class ConfigurationResolver implements IConfigurationResolver {
    private importer;
    private eventbus;
    constructor(importer: IResourceImporter, eventbus: IEventbus);
    importSystemEntry(systemName: string): any;
    process(actionRegistryListener: ActionRegistryEventbusListener | undefined, configuration: IEngineConfiguration): [Record<string, IAction>, IResolvedEngineConfiguration];
    initializeEventActions(actionRegistryListener: ActionRegistryEventbusListener | undefined, config: IEngineConfiguration): void;
    initializeActions(config: IEngineConfiguration, actionsLookup: Record<string, IAction>): void;
    initializeInitActions(config: IEngineConfiguration, actionsLookup: Record<string, IAction>): void;
    initializeTimelineActions(config: IEngineConfiguration): void;
    initializeTimelineAction(timelineConfig: ITimelineConfiguration): void;
    resolveOperations(config: IEngineConfiguration): void;
    processConfiguration(config: any, parentConfig: any): void;
    processConfigProperty(key: string, config: any, parentConfig: any): void;
    _gatherOperations(actions: any[]): any[];
}
export default ConfigurationResolver;
