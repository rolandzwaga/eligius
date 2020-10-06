import { Eventbus, ActionRegistryEventbusListener, RequestVideoUriInterceptor } from './eventbus';
import $ from 'jquery';
import TimelineEventNames from './timeline-event-names';
import ConfigurationResolver from './configuration/configuration-resolver';
import Mousetrap from 'mousetrap';
import LanguageManager from './language-manager';
import {
  IEngineFactory,
  IResourceImporter,
  TResultCallback,
  IEngineConfiguration,
  IConfigurationResolver,
  IChronoTriggerEngine,
  TimelineTypes,
  ITimelineProviderInfo,
  IResolvedEngineConfiguration,
} from './types';
import { IEventbus } from './eventbus/types';
import { IAction } from './action/types';

class EngineFactory implements IEngineFactory {
  private resizeTimeout: any = -1;
  private actionsLookup: Record<string, IAction> = {};
  private importer: IResourceImporter;
  private eventbus: IEventbus;

  constructor(importer: IResourceImporter, windowRef: any, eventbus?: IEventbus) {
    this.importer = importer;
    this.eventbus = eventbus || new Eventbus();
    this.eventbus.on(TimelineEventNames.REQUEST_INSTANCE, this._requestInstanceHandler.bind(this));
    this.eventbus.on(TimelineEventNames.REQUEST_ACTION, this._requestActionHandler.bind(this));
    this.eventbus.on(TimelineEventNames.REQUEST_FUNCTION, this._requestFunctionHandler.bind(this));

    $(windowRef).resize(this._resizeHandler.bind(this));
  }

  destroy() {
    this.eventbus.clear();
  }

  _resizeHandler() {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    this.resizeTimeout = setTimeout(() => {
      this.eventbus.broadcast(TimelineEventNames.RESIZE);
    }, 200);
  }

  _importSystemEntryWithEventbusDependency(systemName: string): any {
    const ctor = this._importSystemEntry(systemName);
    return new ctor(this.eventbus);
  }

  _importSystemEntry(systemName: string): any {
    return this.importer.import(systemName)[systemName];
  }

  _requestInstanceHandler(systemName: string, resultCallback: TResultCallback) {
    resultCallback(this._importSystemEntryWithEventbusDependency(systemName));
  }

  _requestFunctionHandler(systemName: string, resultCallback: TResultCallback) {
    resultCallback(this._importSystemEntry(systemName));
  }

  _requestActionHandler(systemName: string, resultCallback: TResultCallback) {
    const action = this.actionsLookup[systemName];
    if (action) {
      resultCallback(action);
    } else {
      console.error(`Unknown action: ${systemName}`);
      resultCallback(null);
    }
  }

  createEngine(configuration: IEngineConfiguration, resolver?: IConfigurationResolver): IChronoTriggerEngine {
    const { systemName } = configuration.engine;
    const engineClass = this._importSystemEntry(systemName);

    let actionRegistryListener: ActionRegistryEventbusListener | undefined = undefined;
    if (configuration.eventActions && configuration.eventActions.length) {
      actionRegistryListener = new ActionRegistryEventbusListener();
      this.eventbus.registerEventlistener(actionRegistryListener);
    }

    this.eventbus.registerInterceptor(
      TimelineEventNames.REQUEST_TIMELINE_URI,
      new RequestVideoUriInterceptor(this.eventbus)
    );

    resolver = resolver || new ConfigurationResolver(this.importer, this.eventbus);
    const [actionLookup, resolvedConfiguration] = resolver.process(actionRegistryListener, configuration);
    this.actionsLookup = actionLookup;

    const timelineProviders = this._createTimelineProviders(resolvedConfiguration, this.eventbus);

    const { language, labels } = configuration;
    const languageManager = new LanguageManager(language, labels, this.eventbus);

    const chronoTriggerEngine = new engineClass(
      resolvedConfiguration,
      this.eventbus,
      timelineProviders,
      languageManager
    );

    Mousetrap.bind('space', (event) => {
      event.preventDefault();
      this.eventbus.broadcast(TimelineEventNames.PLAY_TOGGLE_REQUEST);
      return false;
    });

    return chronoTriggerEngine;
  }

  _createTimelineProviders(
    configuration: IResolvedEngineConfiguration,
    eventbus: IEventbus
  ): Record<TimelineTypes, ITimelineProviderInfo> {
    const { timelineProviderSettings } = configuration;

    const result = Object.entries(timelineProviderSettings).reduce<Record<TimelineTypes, ITimelineProviderInfo>>(
      (acc, [timelineType, settings]) => {
        const timelineProviderClass = this._importSystemEntry(settings.systemName);
        acc[timelineType as TimelineTypes] = {
          vendor: settings.vendor,
          provider: new timelineProviderClass(eventbus, configuration),
        };
        return acc;
      },
      {} as Record<TimelineTypes, ITimelineProviderInfo>
    );

    return result;
  }
}

export default EngineFactory;
