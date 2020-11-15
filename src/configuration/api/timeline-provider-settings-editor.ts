import { ITimelineProviderSettings } from '~/configuration/types';
import * as timelineProviders from '~/timelineproviders';
import { TimelineTypes } from '~/types';
import { ConfigurationFactory } from './configuration-factory';

export default class TimelineProvidersSettingsEditor {
  constructor(
    private providersSettings: Record<TimelineTypes, ITimelineProviderSettings>,
    private configurationFactory: ConfigurationFactory
  ) {}

  addProvider(timelineType: TimelineTypes) {
    if (this.providersSettings[timelineType]) {
      throw new Error(`Settings for a '${timelineType}' provider already exist`);
    }
    this.providersSettings[timelineType] = {
      id: '',
      poster: '',
      selector: '',
      systemName: '',
      vendor: '',
    };
    return new TimelineProviderSettingsEditor(this.providersSettings[timelineType], this, this.configurationFactory);
  }

  editProvider(timelineType: TimelineTypes) {
    if (!this.providersSettings[timelineType]) {
      throw new Error(`No settings for a '${timelineType}' provider exist yet`);
    }
    return new TimelineProviderSettingsEditor(this.providersSettings[timelineType], this, this.configurationFactory);
  }

  next() {
    return this.configurationFactory;
  }
}

export class TimelineProviderSettingsEditor {
  constructor(
    private providerSettings: ITimelineProviderSettings,
    private providersSettingsEditor: TimelineProvidersSettingsEditor,
    private configurationFactory: ConfigurationFactory
  ) {}

  setVendor(vendor: string) {
    this.providerSettings.vendor = vendor;
    return this;
  }

  setSelector(selector: string) {
    this.providerSettings.selector = selector;
    return this;
  }

  setSystemName(systemName: string) {
    if (!(timelineProviders as any)[systemName]) {
      throw new Error(`Unknown timeline provider system name: ${systemName}`);
    }
    this.providerSettings.systemName = systemName;
    return this;
  }

  next() {
    return this.providersSettingsEditor;
  }

  end() {
    return this.configurationFactory;
  }
}
