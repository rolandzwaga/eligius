import type {IAction} from '@action/types.ts';
import {
  EngineEventbusAdapter,
  EngineInputAdapter,
  LanguageEventbusAdapter,
} from '@adapters/index.ts';
import {ConfigurationResolver} from '@configuration/configuration-resolver.ts';
import type {
  IEngineConfiguration,
  IResolvedEngineConfiguration,
} from '@configuration/types.ts';
import {
  ActionRegistryEventbusListener,
  Eventbus,
  type IEventbus,
  RequestVideoUriInterceptor,
  type TEventbusRemover,
} from '@eventbus/index.ts';
import {LanguageManager} from './language-manager.ts';
import type {
  IConfigurationResolver,
  IEngineFactory,
  IEngineFactoryOptions,
  IEngineFactoryResult,
  ISimpleResourceImporter,
  ITimelineProviderInfo,
  TimelineTypes,
} from './types.ts';

/**
 * The EngineFactory is used to create and initialize an {@link IEligiusEngine} instance.
 *
 * It prepares a resolved configuration and creates the engine based on the class defined in the configuration.
 *
 * @example Loading a configuration and creating an IEligiusEngine instance
 * ```ts
 * import { IEngineConfiguration, EngineFactory, EligiusResourceImporter } from 'eligius';
 * import * as engineConfig from './my-eligius-config.json';
 *
 * const factory = new EngineFactory(new EligiusResourceImporter(), window);
 *
 * const { engine } = factory.createEngine((engineConfig as unknown) as IEngineConfiguration);
 *
 * engine.init().then(()=> {console.log('Eligius engine ready for business');});
 * ```
 */
export class EngineFactory implements IEngineFactory {
  private _actionsLookup: Record<string, IAction> = {};
  private _eventbus: IEventbus;
  private _eventRemovers: TEventbusRemover[] = [];
  private _importer: ISimpleResourceImporter;
  private _windowRef: Window;

  constructor(
    importer: ISimpleResourceImporter,
    windowRef: Window,
    options?: IEngineFactoryOptions
  ) {
    this._importer = importer;
    this._windowRef = windowRef;
    this._eventbus = options?.eventbus ?? new Eventbus();

    this._eventRemovers.push(
      this._eventbus.onRequest(
        'request-instance',
        this._requestInstanceHandler.bind(this)
      )
    );
    this._eventRemovers.push(
      this._eventbus.onRequest(
        'request-action',
        this._requestActionHandler.bind(this)
      )
    );
    this._eventRemovers.push(
      this._eventbus.onRequest(
        'request-function',
        this._requestFunctionHandler.bind(this)
      )
    );
  }

  /**
   * Destroys the factory and cleans up all registered request handlers.
   */
  destroy() {
    this._eventRemovers.forEach(x => x());
  }

  private _importSystemEntryWithEventbusDependency(systemName: string): any {
    const ctor = this._importSystemEntry(systemName);
    return new ctor(this._eventbus);
  }

  private _importSystemEntry(systemName: string): any {
    return this._importer.import(systemName)[systemName];
  }

  private _requestInstanceHandler(systemName: string): any {
    return this._importSystemEntryWithEventbusDependency(systemName);
  }

  private _requestFunctionHandler(systemName: string): any {
    return this._importSystemEntry(systemName);
  }

  private _requestActionHandler(systemName: string): IAction | null {
    const action = this._actionsLookup[systemName];
    if (action) {
      return action;
    } else {
      console.error(`Unknown action: ${systemName}`);
      return null;
    }
  }

  /**
   * Creates a fully wired engine with adapters and event handlers.
   *
   * This method:
   * - Resolves the configuration
   * - Creates timeline providers
   * - Instantiates the engine and language manager
   * - Creates and connects adapters for eventbus integration
   *
   * @param configuration - The engine configuration
   * @param resolver - Optional custom configuration resolver
   * @returns Engine result with engine, language manager, eventbus, and destroy function
   */
  createEngine(
    configuration: IEngineConfiguration,
    resolver?: IConfigurationResolver
  ): IEngineFactoryResult {
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
    const languageManager = new LanguageManager(language, labels);

    const engineInstance = new EngineClass(
      resolvedConfiguration,
      this._eventbus,
      timelineProviders,
      languageManager
    );

    // Create and connect adapters
    const engineEventbusAdapter = new EngineEventbusAdapter(
      engineInstance,
      this._eventbus
    );
    const languageEventbusAdapter = new LanguageEventbusAdapter(
      languageManager,
      this._eventbus,
      engineInstance
    );
    const engineInputAdapter = new EngineInputAdapter(
      engineInstance,
      this._eventbus,
      this._windowRef
    );

    // Connect all adapters
    engineEventbusAdapter.connect();
    languageEventbusAdapter.connect();
    engineInputAdapter.connect();

    // Return the factory result
    return {
      engine: engineInstance,
      languageManager,
      eventbus: this._eventbus,
      destroy: async () => {
        // Disconnect adapters first
        engineInputAdapter.disconnect();
        languageEventbusAdapter.disconnect();
        engineEventbusAdapter.disconnect();

        // Then destroy engine and language manager
        await engineInstance.destroy();
        languageManager.destroy();
      },
    };
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
