import { v4 as uuidv4 } from 'uuid';
import * as timelineProviders from '../../timelineproviders/index.ts';
import type { TimelineTypes } from '../../types.ts';
import type { ITimelineProviderSettings, TTimelineProviderSettings } from '../types.ts';
import { ConfigurationFactory } from './configuration-factory.ts';

export class TimelineProvidersSettingsEditor {
  constructor(
    private providersSettings: TTimelineProviderSettings,
    private configurationFactory: ConfigurationFactory
  ) {}

  addProvider(timelineType: TimelineTypes) {
    if (this.providersSettings[timelineType]) {
      throw new Error(
        `Settings for a '${timelineType}' provider already exist`
      );
    }
    const settings: ITimelineProviderSettings = {
      id: uuidv4(),
      poster: undefined,
      selector: undefined,
      systemName: '',
      vendor: '',
    };
    this.providersSettings[timelineType] = settings;
    return new TimelineProviderSettingsEditor(
      settings,
      this,
      this.configurationFactory
    );
  }

  editProvider(timelineType: TimelineTypes) {
    if (!this.providersSettings[timelineType]) {
      throw new Error(`No settings for a '${timelineType}' provider exist yet`);
    }

    return new TimelineProviderSettingsEditor(
      this.providersSettings[timelineType] as ITimelineProviderSettings,
      this,
      this.configurationFactory
    );
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
