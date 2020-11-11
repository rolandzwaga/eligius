import { IAction } from '../action/types';
import { ActionRegistryEventbusListener } from '../eventbus';
import { IEventbus } from '../eventbus/types';
import { IConfigurationResolver, IResourceImporter } from '../types';
import { IEngineConfiguration, IResolvedEngineConfiguration } from './types';
export declare class ConfigurationResolver implements IConfigurationResolver {
    private importer;
    private eventbus;
    constructor(importer: IResourceImporter, eventbus: IEventbus);
    process(configuration: IEngineConfiguration, actionRegistryListener?: ActionRegistryEventbusListener): [Record<string, IAction>, IResolvedEngineConfiguration];
}
