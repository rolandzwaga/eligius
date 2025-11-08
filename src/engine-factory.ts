import hk, {type HotkeysEvent} from 'hotkeys-js';
import $ from 'jquery';
import type {IAction} from './action/types.ts';
import {ConfigurationResolver} from './configuration/configuration-resolver.ts';
import type {
  IEngineConfiguration,
  IResolvedEngineConfiguration,
} from './configuration/types.ts';
import {DevToolEventListener} from './diagnostics/devtool-event-listener.ts';
import {Diagnostics} from './diagnostics/diagnostics.ts';
import {
  DEV_TOOLS_KEY,
  type TDiagnosticType,
  type TWindowWithDevtools,
} from './diagnostics/types.ts';
import {
  ActionRegistryEventbusListener,
  Eventbus,
  type IEventbus,
  RequestVideoUriInterceptor,
  type TEventbusRemover,
} from './eventbus/index.ts';
import {LanguageManager} from './language-manager.ts';
import type {
  IConfigurationResolver,
  IEligiusEngine,
  IEngineFactory,
  IEngineFactoryOptions,
  ISimpleResourceImporter,
  ITimelineProviderInfo,
  TimelineTypes,
  TResultCallback,
} from './types.ts';
import {prepareValueForSerialization} from './util/prepare-value-for-serialization.ts';

const hotkeys = hk.default || hk;

/**
 * The EngineFactory is used to create and initialize an {@link IEligiusEngine} instance.
 *
 * It prepares a resolved configuration and creates the engine based on the class defined in the configuration.
 *
 * @example Loading a configuration and creating an IEligiusEngine instance
 * ```ts
 * import { IEngineConfiguration, EngineFactory, WebpackResourceImporter } from 'eligius';
 * import * as engineConfig from './my-eligius-config.json';
 *
 * const factory = new EngineFactory(new WebpackResourceImporter(), window);
 *
 * const engine = factory.createEngine((engineConfig as unknown) as IEngineConfiguration);
 *
 * engine.init().then(()=> {console.log('Eligius engine ready for business');});
 * ```
 */
export class EngineFactory implements IEngineFactory {
  private _actionsLookup: Record<string, IAction> = {};
  private _eventbus: IEventbus;
  private _eventRemovers: TEventbusRemover[] = [];
  private _importer: ISimpleResourceImporter;
  private _resizeTimeout: any = -1;

  constructor(
    importer: ISimpleResourceImporter,
    windowRef: Window,
    options?: IEngineFactoryOptions
  ) {
    this._importer = importer;
    this._eventbus = options?.eventbus ?? new Eventbus();

    Diagnostics.active = options?.devtools ?? false;
    if (Diagnostics.active) {
      this._initializeDevtools(this._eventbus);
    }

    this._eventRemovers.push(
      this._eventbus.on(
        'request-instance',
        this._requestInstanceHandler.bind(this)
      )
    );
    this._eventRemovers.push(
      this._eventbus.on('request-action', this._requestActionHandler.bind(this))
    );
    this._eventRemovers.push(
      this._eventbus.on(
        'request-function',
        this._requestFunctionHandler.bind(this)
      )
    );

    const handleSpaceBound = this._handleSpacePress.bind(this);
    hotkeys('space', handleSpaceBound);
    this._eventRemovers.push(() => hotkeys.unbind('space', handleSpaceBound));

    const resizeBound = this._resizeHandler.bind(this);
    const jqWin = $(windowRef);
    jqWin.on('resize', resizeBound);
    this._eventRemovers.push(() => jqWin.off('resize', resizeBound));
  }

  private _handleSpacePress(
    keyboardEvent: KeyboardEvent,
    _hotkeysEvent: HotkeysEvent
  ): void | boolean {
    keyboardEvent.preventDefault();
    this._eventbus.broadcast('timeline-play-toggle-request', []);
    return false;
  }

  private _initializeDevtools(eventbus: IEventbus) {
    const diagnosticInfo = (window as unknown as TWindowWithDevtools)[
      DEV_TOOLS_KEY
    ];

    if (diagnosticInfo) {
      const {agent} = diagnosticInfo;

      this._eventRemovers.push(
        eventbus.registerEventlistener(new DevToolEventListener(agent))
      );

      this._eventRemovers.push(
        agent.subscribe(message => {
          if (message.type === 'playcontrol') {
            switch (message.data.kind) {
              case 'play':
                this._eventbus.broadcast('timeline-play-request', []);
                break;
              case 'stop':
                this._eventbus.broadcast('timeline-stop-request', []);
                break;
              case 'pause':
                this._eventbus.broadcast('timeline-pause-request', []);
                break;
              case 'seek':
                this._eventbus.broadcast('timeline-seek-request', [
                  (message.data.args ?? 0) as number,
                ]);
                break;
            }
          }
        })
      );

      Diagnostics.send = (name: TDiagnosticType, messageData: any) => {
        const message = prepareValueForSerialization(messageData);
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
        `${DEV_TOOLS_KEY} property not found on window, please install the Eligius Devtools extension.`
      );
    }
  }

  destroy() {
    this._eventRemovers.forEach(x => x());
  }

  private _resizeHandler() {
    if (this._resizeTimeout) {
      clearTimeout(this._resizeTimeout);
      this._resizeTimeout = -1;
    }
    this._resizeTimeout = setTimeout(() => {
      this._eventbus.broadcast('timeline-resize', []);
    }, 200);
  }

  private _importSystemEntryWithEventbusDependency(systemName: string): any {
    const ctor = this._importSystemEntry(systemName);
    return new ctor(this._eventbus);
  }

  private _importSystemEntry(systemName: string): any {
    return this._importer.import(systemName)[systemName];
  }

  private _requestInstanceHandler(
    systemName: string,
    resultCallback: TResultCallback<any>
  ) {
    resultCallback(this._importSystemEntryWithEventbusDependency(systemName));
  }

  private _requestFunctionHandler(
    systemName: string,
    resultCallback: TResultCallback<any>
  ) {
    resultCallback(this._importSystemEntry(systemName));
  }

  private _requestActionHandler(
    systemName: string,
    resultCallback: TResultCallback<IAction | null>
  ) {
    const action = this._actionsLookup[systemName];
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
    const {systemName} = configuration.engine;
    const EngineClass = this._importSystemEntry(systemName);

    let actionRegistryListener: ActionRegistryEventbusListener | undefined;
    if (configuration.eventActions?.length) {
      actionRegistryListener = new ActionRegistryEventbusListener();
      this._eventRemovers.push(
        this._eventbus.registerEventlistener(actionRegistryListener)
      );
    }

    this._eventRemovers.push(
      this._eventbus.registerInterceptor(
        'request-timeline-uri',
        new RequestVideoUriInterceptor(this._eventbus)
      )
    );

    resolver =
      resolver || new ConfigurationResolver(this._importer, this._eventbus);
    const [actionLookup, resolvedConfiguration] = resolver.process(
      configuration,
      actionRegistryListener
    );
    this._actionsLookup = actionLookup;

    const timelineProviders = this._createTimelineProviders(
      resolvedConfiguration
    );

    const {language, labels} = configuration;
    const languageManager = new LanguageManager(
      language,
      labels,
      this._eventbus
    );

    const engineInstance = new EngineClass(
      resolvedConfiguration,
      this._eventbus,
      timelineProviders,
      languageManager
    );

    return engineInstance;
  }

  private _createTimelineProviders(
    configuration: IResolvedEngineConfiguration
  ): Record<TimelineTypes, ITimelineProviderInfo> {
    const {timelineProviderSettings} = configuration;

    const result = Object.entries(timelineProviderSettings).reduce<
      Record<TimelineTypes, ITimelineProviderInfo>
    >(
      (acc, [timelineType, settings]) => {
        if (!settings) {
          return acc;
        }

        const TimelineProviderClass = this._importSystemEntry(
          settings.systemName
        );
        acc[timelineType as TimelineTypes] = {
          id: settings.id,
          vendor: settings.vendor,
          provider: new TimelineProviderClass(configuration),
        };
        return acc;
      },
      {} as Record<TimelineTypes, ITimelineProviderInfo>
    );

    return result;
  }
}
