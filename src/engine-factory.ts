import hotkeys, { HotkeysEvent } from 'hotkeys-js';
import $ from 'jquery';
import { IAction } from './action/types';
import { ConfigurationResolver } from './configuration/configuration-resolver';
import {
  IEngineConfiguration,
  IResolvedEngineConfiguration,
} from './configuration/types';
import { DevToolEventListener } from './diagnostics/devtool-event-lister';
import { Diagnostics } from './diagnostics/diagnostics';
import {
  DEV_TOOLS_KEY,
  IDiagnosticsInfo,
  TDiagnosticType,
} from './diagnostics/types';
import {
  ActionRegistryEventbusListener,
  Eventbus,
  IEventbus,
  RequestVideoUriInterceptor,
} from './eventbus';
import { LanguageManager } from './language-manager';
import { TimelineEventNames } from './timeline-event-names';
import {
  IConfigurationResolver,
  IEligiusEngine,
  IEngineFactory,
  IEngineFactoryOptions,
  ISimpleResourceImporter,
  ITimelineProviderInfo,
  TimelineTypes,
  TResultCallback,
} from './types';
import { prepareValueForSerialization } from './util/prepare-value-for-serialization';

export class EngineFactory implements IEngineFactory {
  private resizeTimeout: any = -1;
  private actionsLookup: Record<string, IAction> = {};
  private importer: ISimpleResourceImporter;
  private eventbus: IEventbus;
  private _handleSpaceBound: any;

  constructor(
    importer: ISimpleResourceImporter,
    windowRef: Window,
    options?: IEngineFactoryOptions
  ) {
    this.importer = importer;
    this.eventbus = options?.eventbus || new Eventbus();

    Diagnostics.active = options?.devtools ?? false;
    if (Diagnostics.active) {
      this._initializeDevtools(this.eventbus);
    }

    this.eventbus.on(
      TimelineEventNames.REQUEST_INSTANCE,
      this._requestInstanceHandler.bind(this)
    );
    this.eventbus.on(
      TimelineEventNames.REQUEST_ACTION,
      this._requestActionHandler.bind(this)
    );
    this.eventbus.on(
      TimelineEventNames.REQUEST_FUNCTION,
      this._requestFunctionHandler.bind(this)
    );

    this._handleSpaceBound = this._handleSpacePress.bind(this);
    hotkeys('space', this._handleSpaceBound);

    $(windowRef).resize(this._resizeHandler.bind(this));
  }

  private _handleSpacePress(
    keyboardEvent: KeyboardEvent,
    _hotkeysEvent: HotkeysEvent
  ): void | boolean {
    keyboardEvent.preventDefault();
    this.eventbus.broadcast(TimelineEventNames.PLAY_TOGGLE_REQUEST);
    return false;
  }

  private _initializeDevtools(eventbus: IEventbus) {
    const diagnosticInfo = (window as any)[DEV_TOOLS_KEY] as
      | IDiagnosticsInfo
      | undefined;
    if (diagnosticInfo) {
      const { agent } = diagnosticInfo;
      const eventbusListener = new DevToolEventListener(agent);
      eventbus.registerEventlistener(eventbusListener);
      Diagnostics.send = (name: TDiagnosticType, data: any) => {
        const message = prepareValueForSerialization(data);
        try {
          agent.postMessage(name, message);
        } catch (e) {
          console.error('postmessage failed');
          console.error(e);
          console.log('message', message);
        }
      };
      Diagnostics.send(
        'eligius-diagnostics-factory',
        'Diagnostics initialized'
      );
    } else {
      console.warn(
        `${DEV_TOOLS_KEY} property not found on window, please install the extension.`
      );
    }
  }

  destroy() {
    this.eventbus.clear();
    hotkeys.unbind('space', this._handleSpaceBound);
  }

  private _resizeHandler() {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    this.resizeTimeout = setTimeout(() => {
      this.eventbus.broadcast(TimelineEventNames.RESIZE);
    }, 200);
  }

  private _importSystemEntryWithEventbusDependency(systemName: string): any {
    const ctor = this._importSystemEntry(systemName);
    return new ctor(this.eventbus);
  }

  private _importSystemEntry(systemName: string): any {
    return this.importer.import(systemName)[systemName];
  }

  private _requestInstanceHandler(
    systemName: string,
    resultCallback: TResultCallback
  ) {
    resultCallback(this._importSystemEntryWithEventbusDependency(systemName));
  }

  private _requestFunctionHandler(
    systemName: string,
    resultCallback: TResultCallback
  ) {
    resultCallback(this._importSystemEntry(systemName));
  }

  private _requestActionHandler(
    systemName: string,
    resultCallback: TResultCallback
  ) {
    const action = this.actionsLookup[systemName];
    if (action) {
      resultCallback(action);
    } else {
      console.error(`Unknown action: ${systemName}`);
      resultCallback(null);
    }
  }

  createEngine(
    configuration: IEngineConfiguration,
    resolver?: IConfigurationResolver
  ): IEligiusEngine {
    const { systemName } = configuration.engine;
    const EngineClass = this._importSystemEntry(systemName);

    let actionRegistryListener: ActionRegistryEventbusListener | undefined =
      undefined;
    if (configuration.eventActions?.length) {
      actionRegistryListener = new ActionRegistryEventbusListener();
      this.eventbus.registerEventlistener(actionRegistryListener);
    }

    this.eventbus.registerInterceptor(
      TimelineEventNames.REQUEST_TIMELINE_URI,
      new RequestVideoUriInterceptor(this.eventbus)
    );

    resolver =
      resolver || new ConfigurationResolver(this.importer, this.eventbus);
    const [actionLookup, resolvedConfiguration] = resolver.process(
      configuration,
      actionRegistryListener
    );
    this.actionsLookup = actionLookup;

    const timelineProviders = this._createTimelineProviders(
      resolvedConfiguration,
      this.eventbus
    );

    const { language, labels } = configuration;
    const languageManager = new LanguageManager(
      language,
      labels,
      this.eventbus
    );

    const engineInstance = new EngineClass(
      resolvedConfiguration,
      this.eventbus,
      timelineProviders,
      languageManager
    );

    return engineInstance;
  }

  private _createTimelineProviders(
    configuration: IResolvedEngineConfiguration,
    eventbus: IEventbus
  ): Record<TimelineTypes, ITimelineProviderInfo> {
    const { timelineProviderSettings } = configuration;

    const result = Object.entries(timelineProviderSettings).reduce<
      Record<TimelineTypes, ITimelineProviderInfo>
    >((acc, [timelineType, settings]) => {
      if (!settings) {
        return acc;
      }

      const timelineProviderClass = this._importSystemEntry(
        settings.systemName
      );
      acc[timelineType as TimelineTypes] = {
        id: settings.id,
        vendor: settings.vendor,
        provider: new timelineProviderClass(eventbus, configuration),
      };
      return acc;
    }, {} as Record<TimelineTypes, ITimelineProviderInfo>);

    return result;
  }
}
