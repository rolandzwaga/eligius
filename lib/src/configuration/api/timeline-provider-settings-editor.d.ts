import { ITimelineProviderSettings, TTimelineProviderSettings } from '~/configuration/types';
import { TimelineTypes } from '~/types';
import { ConfigurationFactory } from './configuration-factory';
export declare class TimelineProvidersSettingsEditor {
    private providersSettings;
    private configurationFactory;
    constructor(providersSettings: TTimelineProviderSettings, configurationFactory: ConfigurationFactory);
    addProvider(timelineType: TimelineTypes): TimelineProviderSettingsEditor;
    editProvider(timelineType: TimelineTypes): TimelineProviderSettingsEditor;
    next(): ConfigurationFactory;
}
export declare class TimelineProviderSettingsEditor {
    private providerSettings;
    private providersSettingsEditor;
    private configurationFactory;
    constructor(providerSettings: ITimelineProviderSettings, providersSettingsEditor: TimelineProvidersSettingsEditor, configurationFactory: ConfigurationFactory);
    setVendor(vendor: string): this;
    setSelector(selector: string): this;
    setSystemName(systemName: string): this;
    next(): TimelineProvidersSettingsEditor;
    end(): ConfigurationFactory;
}
