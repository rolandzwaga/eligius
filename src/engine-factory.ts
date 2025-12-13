import type {IAction} from '@action/types.ts';
import {
  EngineEventbusAdapter,
  EngineInputAdapter,
  LocaleEventbusAdapter,
} from '@adapters/index.ts';
import {ConfigurationResolver} from '@configuration/configuration-resolver.ts';
import type {
  IEngineConfiguration,
  IResolvedEngineConfiguration,
  ITimelineProviderSettings,
} from '@configuration/types.ts';
import {
  ActionRegistryEventbusListener,
  Eventbus,
  type IEventbus,
  RequestVideoUriInterceptor,
  type TEventbusRemover,
} from '@eventbus/index.ts';
import type {
  IContainerProvider,
  IPlaylist,
  IPositionSource,
} from '@timelineproviders/types.ts';
import {LocaleManager} from './locale/locale-manager.ts';
import type {TLanguageCode, TLocaleData} from './locale/types.ts';
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
    this._eventRemovers = [];
    this._actionsLookup = {};
  }

  private _importSystemEntryWithEventbusDependency(systemName: string): any {
    const ctor = this._importSystemEntry(systemName);
    return new ctor(this._eventbus);
  }

  private _importSystemEntry(systemName: string): any {
    const module = this._importer.import(systemName);
    const entry = module?.[systemName];
    if (!entry) {
      throw new Error(
        `Failed to import '${systemName}': module does not export '${systemName}'`
      );
    }
    return entry;
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
   * - Instantiates the engine and locale manager
   * - Creates and connects adapters for eventbus integration
   *
   * @param configuration - The engine configuration
   * @param resolver - Optional custom configuration resolver
   * @returns Engine result with engine, locale manager, eventbus, and destroy function
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

    // Initialize locale manager with locales from configuration
    const {language, locales} = configuration;
    const localeManager = new LocaleManager({
      defaultLocale: language as TLanguageCode,
    });

    // Load locales from configuration
    if (locales) {
      for (const [locale, data] of Object.entries(locales)) {
        localeManager.loadLocale(locale as TLanguageCode, data as TLocaleData);
      }
    }

    const engineInstance = new EngineClass(
      resolvedConfiguration,
      this._eventbus,
      timelineProviders,
      localeManager
    );

    // Create and connect adapters
    const engineEventbusAdapter = new EngineEventbusAdapter(
      engineInstance,
      this._eventbus
    );
    const localeEventbusAdapter = new LocaleEventbusAdapter(
      localeManager,
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
    localeEventbusAdapter.connect();
    engineInputAdapter.connect();

    // Return the factory result
    return {
      engine: engineInstance,
      localeManager,
      eventbus: this._eventbus,
      destroy: async () => {
        // Disconnect adapters first
        engineInputAdapter.disconnect();
        localeEventbusAdapter.disconnect();
        engineEventbusAdapter.disconnect();

        // Destroy engine (which also destroys localeManager internally)
        await engineInstance.destroy();
        // Note: localeManager.destroy() is NOT called here because
        // engineInstance.destroy() already calls it
      },
    };
  }

  private _createTimelineProviders(
    configuration: IResolvedEngineConfiguration
  ): Record<TimelineTypes, ITimelineProviderInfo> {
    // Delegate to the new config-driven method
    return this.createTimelineProvidersForConfig(configuration);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Config-Driven Factory Methods
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Creates a position source for a specific timeline based on configuration.
   *
   * The position source class is resolved dynamically via the resource importer
   * using the `systemName` property from the configuration.
   *
   * @param timeline - The resolved timeline configuration
   * @param settings - The timeline provider settings containing position source config
   * @returns A configured position source
   * @throws Error if the position source class cannot be resolved
   */
  createPositionSourceForTimeline(
    timeline: IResolvedEngineConfiguration['timelines'][number],
    settings: ITimelineProviderSettings
  ): IPositionSource {
    const config = settings.positionSource;
    const {systemName, ...options} = config;

    const PositionSourceClass = this._importSystemEntry(systemName);

    // Merge timeline-specific values with config options
    const constructorConfig = {
      ...options,
      duration: timeline.duration,
    };

    return new PositionSourceClass(constructorConfig);
  }

  /**
   * Creates a container provider based on timeline provider settings.
   *
   * The container provider class is resolved dynamically via the resource importer
   * using the `systemName` property from the configuration.
   *
   * @param settings - The timeline provider settings
   * @returns A container provider, or undefined if not configured
   * @throws Error if the container provider class cannot be resolved
   */
  createContainerProviderForTimeline(
    settings: ITimelineProviderSettings
  ): IContainerProvider | undefined {
    if (!settings.container) {
      return undefined;
    }

    const {systemName, ...options} = settings.container;
    const ContainerProviderClass = this._importSystemEntry(systemName);

    return new ContainerProviderClass(options);
  }

  /**
   * Creates a playlist based on timeline provider settings.
   *
   * The playlist class is resolved dynamically via the resource importer
   * using the `systemName` property from the configuration.
   *
   * @param settings - The timeline provider settings
   * @returns A playlist, or undefined if not configured
   * @throws Error if the playlist class cannot be resolved
   */
  createPlaylistForTimeline(
    settings: ITimelineProviderSettings
  ): IPlaylist | undefined {
    if (!settings.playlist) {
      return undefined;
    }

    const {systemName, ...options} = settings.playlist;
    const PlaylistClass = this._importSystemEntry(systemName);

    return new PlaylistClass(options);
  }

  /**
   * Assembles a complete ITimelineProviderInfo from timeline and settings.
   *
   * This is the main entry point for creating provider info with the new
   * configuration-driven architecture.
   *
   * @param timeline - The resolved timeline configuration
   * @param settings - The timeline provider settings
   * @returns A complete timeline provider info with all components
   */
  createTimelineProviderInfo(
    timeline: IResolvedEngineConfiguration['timelines'][number],
    settings: ITimelineProviderSettings
  ): ITimelineProviderInfo {
    return {
      positionSource: this.createPositionSourceForTimeline(timeline, settings),
      containerProvider: this.createContainerProviderForTimeline(settings),
      playlist: this.createPlaylistForTimeline(settings),
    };
  }

  /**
   * Creates timeline providers for all configured timeline types using the new
   * configuration-driven architecture.
   *
   * This method iterates over timelineProviderSettings and creates a
   * ITimelineProviderInfo for each configured timeline type by:
   * 1. Finding the first timeline that matches the type
   * 2. Using the timeline's duration for the position source
   * 3. Assembling components from the settings
   *
   * @param configuration - The resolved engine configuration
   * @returns A record of timeline types to their provider info
   * @throws Error if a provider setting has no matching timeline in config
   */
  createTimelineProvidersForConfig(
    configuration: IResolvedEngineConfiguration
  ): Record<TimelineTypes, ITimelineProviderInfo> {
    const {timelineProviderSettings, timelines} = configuration;

    const result = Object.entries(timelineProviderSettings).reduce<
      Record<TimelineTypes, ITimelineProviderInfo>
    >(
      (acc, [timelineType, settings]) => {
        if (!settings) {
          return acc;
        }

        // Find the first timeline that matches this type
        const matchingTimeline = timelines.find(t => t.type === timelineType);
        if (!matchingTimeline) {
          throw new Error(
            `Timeline provider settings for '${timelineType}' has no matching timeline in configuration`
          );
        }

        acc[timelineType as TimelineTypes] = this.createTimelineProviderInfo(
          matchingTimeline,
          settings
        );
        return acc;
      },
      {} as Record<TimelineTypes, ITimelineProviderInfo>
    );

    return result;
  }
}
