import { IEngineConfiguration } from '~/configuration/types';
import { IEventbus } from '~/eventbus/types';
import { IChronoTriggerEngine, IConfigurationResolver, IEngineFactory, IResourceImporter } from './types';
export declare class EngineFactory implements IEngineFactory {
    private resizeTimeout;
    private actionsLookup;
    private importer;
    private eventbus;
    constructor(importer: IResourceImporter, windowRef: any, eventbus?: IEventbus);
    destroy(): void;
    private _resizeHandler;
    private _importSystemEntryWithEventbusDependency;
    private _importSystemEntry;
    private _requestInstanceHandler;
    private _requestFunctionHandler;
    private _requestActionHandler;
    createEngine(configuration: IEngineConfiguration, resolver?: IConfigurationResolver): IChronoTriggerEngine;
    private _createTimelineProviders;
}
