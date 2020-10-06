import { IEngineFactory, IResourceImporter, TResultCallback, IEngineConfiguration, IConfigurationResolver, IChronoTriggerEngine, TimelineTypes, ITimelineProviderInfo, IResolvedEngineConfiguration } from './types';
import { IEventbus } from './eventbus/types';
declare class EngineFactory implements IEngineFactory {
    private resizeTimeout;
    private actionsLookup;
    private importer;
    private eventbus;
    constructor(importer: IResourceImporter, windowRef: any, eventbus?: IEventbus);
    destroy(): void;
    _resizeHandler(): void;
    _importSystemEntryWithEventbusDependency(systemName: string): any;
    _importSystemEntry(systemName: string): any;
    _requestInstanceHandler(systemName: string, resultCallback: TResultCallback): void;
    _requestFunctionHandler(systemName: string, resultCallback: TResultCallback): void;
    _requestActionHandler(systemName: string, resultCallback: TResultCallback): void;
    createEngine(configuration: IEngineConfiguration, resolver?: IConfigurationResolver): IChronoTriggerEngine;
    _createTimelineProviders(configuration: IResolvedEngineConfiguration, eventbus: IEventbus): Record<TimelineTypes, ITimelineProviderInfo>;
}
export default EngineFactory;
