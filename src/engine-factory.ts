import type {IAction} from '@action/types.ts';
import {
  EngineEventbusAdapter,
  EngineInputAdapter,
  type IAdapter,
  LocaleEventbusAdapter,
} from '@adapters/index.ts';
import {ConfigurationResolver} from '@configuration/configuration-resolver.ts';
import {
  effectiveContainerProvider,
  effectivePositionSource,
  overridesContainerProvider,
  overridesPositionSource,
  providerConfigKey,
} from '@configuration/timeline-provider-overrides.ts';
import type {
  IEngineConfiguration,
  IPositionSourceConfig,
  IResolvedEngineConfiguration,
  IResolvedTimelineConfiguration,
  ITimelineProviderSettings,
} from '@configuration/types.ts';
import {
  ActionRegistryEventbusListener,
  Eventbus,
  type IEventbus,
  RequestVideoUriInterceptor,
  type TEventbusRemover,
} from '@eventbus/index.ts';
import {clearGlobals} from '@operation/helper/globals.ts';
import {clearJsonCache} from '@operation/load-json.ts';
import type {
  IContainerProvider,
  IPlaylist,
  IPositionSource,
} from '@timelineproviders/types.ts';
import {findClosestNames, formatDidYouMean} from '@util/find-closest-names.ts';
import {LocaleLoader} from './locale/locale-loader.ts';
import {LocaleManager} from './locale/locale-manager.ts';
import {
  type ILocaleReference,
  type ILocalesConfiguration,
  isLocaleReference,
  type TLanguageCode,
} from './locale/types.ts';
import type {
  IConfigurationResolver,
  IEligiusEngine,
  IEngineFactory,
  IEngineFactoryOptions,
  IEngineFactoryResult,
  ISimpleResourceImporter,
  ITimelineProviderInfo,
  TimelineTypes,
} from './types.ts';

/**
 * Number of engines created by any factory whose destroy() has not run yet.
 * The global data store (see globals.ts) and the loadJson cache are
 * module-wide, so they are cleared only when this drops to zero.
 */
let liveEngineCount = 0;

/**
 * How long one external (`$ref`) locale file may take to load before
 * engine.init() rejects, in milliseconds.
 */
const LOCALE_LOAD_TIMEOUT_MS = 30000;

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
  /** The eventbus from the options, shared by every engine; see `options` */
  private _sharedEventbus: IEventbus | undefined;
  /**
   * Every eventbus registration the factory made that is still in place.
   * An engine's destroy() removes its own; factory.destroy() the rest.
   */
  private _eventRemovers: Set<TEventbusRemover> = new Set();
  /** Action lookups of the live engines, oldest first */
  private _actionLookups: Map<object, Record<string, IAction>> = new Map();
  /** Live engines on the shared eventbus */
  private _liveSharedEngines = 0;
  private _importer: ISimpleResourceImporter;
  private _windowRef: Window;
  private _options: IEngineFactoryOptions | undefined;

  /**
   * @param importer - Resolves system names (engine, operations, controllers,
   * providers) to their implementations
   * @param windowRef - The window the engines run in
   * @param options - Optional settings. Without `options.eventbus` every
   * engine gets its own eventbus; see {@link IEngineFactoryOptions.eventbus}.
   */
  constructor(
    importer: ISimpleResourceImporter,
    windowRef: Window,
    options?: IEngineFactoryOptions
  ) {
    this._importer = importer;
    this._windowRef = windowRef;
    this._options = options;
    this._sharedEventbus = options?.eventbus;

    if (this._sharedEventbus) {
      // Requests on a shared bus carry no engine identity, so 'request-action'
      // searches the live engines, newest first.
      this._registerResponders(
        this._sharedEventbus,
        systemName => this._findLiveAction(systemName),
        () => this._liveActionNames(),
        remover => this._eventRemovers.add(remover)
      );
    }
  }

  /**
   * Destroys the factory and cleans up all registered request handlers.
   */
  destroy() {
    const removers = [...this._eventRemovers];
    this._eventRemovers.clear();
    removers.forEach(remove => remove());
    this._actionLookups.clear();
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

  /**
   * Registers the 'request-instance', 'request-action' and
   * 'request-function' responders on an eventbus. Instances are constructed
   * with that eventbus. 'request-action' throws for an unknown action name,
   * with a "did you mean" hint built from `knownActions`.
   */
  private _registerResponders(
    eventbus: IEventbus,
    findAction: (systemName: string) => IAction | undefined,
    knownActions: () => string[],
    addRemover: (remover: TEventbusRemover) => void
  ) {
    addRemover(
      eventbus.onRequest('request-instance', (systemName: string) => {
        const ctor = this._importSystemEntry(systemName);
        return new ctor(eventbus);
      })
    );
    addRemover(
      eventbus.onRequest('request-action', (systemName: string): IAction => {
        const action = findAction(systemName);
        if (action) {
          return action;
        }
        throw new Error(unknownActionMessage(systemName, knownActions()));
      })
    );
    addRemover(
      eventbus.onRequest('request-function', (systemName: string) =>
        this._importSystemEntry(systemName)
      )
    );
  }

  private _findLiveAction(systemName: string): IAction | undefined {
    const lookups = [...this._actionLookups.values()];
    for (let i = lookups.length - 1; i >= 0; i--) {
      if (Object.hasOwn(lookups[i], systemName)) {
        return lookups[i][systemName];
      }
    }
    return undefined;
  }

  private _liveActionNames(): string[] {
    const names = new Set<string>();
    this._actionLookups.forEach(lookup => {
      Object.keys(lookup).forEach(name => names.add(name));
    });
    return [...names];
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
   * Unless the factory was given an eventbus, the engine gets an eventbus of
   * its own, so several live engines from one factory do not answer each
   * other's requests or react to each other's commands. When this method
   * throws, nothing it registered is left on the eventbus and pending
   * external locale loads are aborted.
   *
   * External (`$ref`) locales are loaded with a 30 second timeout per file.
   * Destroying the engine (through the returned `destroy()` or
   * `engine.destroy()`) aborts loads that are still pending.
   *
   * @param configuration - The engine configuration
   * @param resolver - Optional custom configuration resolver
   * @returns Engine result with engine, locale manager, eventbus, and destroy function
   * @throws Error when the configuration cannot be resolved or a provider
   * cannot be created
   */
  createEngine(
    configuration: IEngineConfiguration,
    resolver?: IConfigurationResolver
  ): IEngineFactoryResult {
    const {systemName} = configuration.engine;
    const EngineClass = this._importSystemEntry(systemName);

    const ownsEventbus = !this._sharedEventbus;
    const eventbus = this._sharedEventbus ?? new Eventbus();
    if (!ownsEventbus && this._liveSharedEngines > 0) {
      console.warn(
        '[EngineFactory] Creating a second live engine on a shared eventbus: requests such as request-engine-root are answered by the first engine and commands reach both. Use a factory without options.eventbus to give each engine its own eventbus.'
      );
    }

    // Registrations that belong to this engine. The returned destroy() removes
    // them; they are also tracked factory-wide, so factory.destroy() still
    // removes them if the engine is never destroyed.
    const engineRemovers: TEventbusRemover[] = [];
    const addEngineRemover = (remover: TEventbusRemover) => {
      engineRemovers.push(remover);
      this._eventRemovers.add(remover);
    };
    // Aborts this engine's pending external locale loads.
    const localeLoads = new AbortController();
    const removeEngineRegistrations = () => {
      const removers = engineRemovers.splice(0);
      removers.forEach(remove => {
        this._eventRemovers.delete(remove);
        remove();
      });
      if (ownsEventbus) {
        eventbus.clear();
      }
    };

    let engineInstance: IEligiusEngine;
    let localeManager: LocaleManager;
    let adapters: IAdapter[] = [];
    let engineInputAdapter: EngineInputAdapter;
    try {
      // Resolve first: it throws on unknown names and duplicate actions, and
      // nothing is registered on the eventbus yet.
      const actionRegistryListener = configuration.eventActions?.length
        ? new ActionRegistryEventbusListener()
        : undefined;
      resolver =
        resolver || new ConfigurationResolver(this._importer, eventbus);
      const [actionLookup, resolvedConfiguration] = resolver.process(
        configuration,
        actionRegistryListener
      );

      const timelineProviders = this._createTimelineProviders(
        resolvedConfiguration
      );
      const timelineProvidersByUri = this.createTimelineProvidersByUri(
        resolvedConfiguration,
        timelineProviders
      );

      const lookupKey = {};
      this._actionLookups.set(lookupKey, actionLookup);
      addEngineRemover(() => this._actionLookups.delete(lookupKey));
      if (ownsEventbus) {
        this._registerResponders(
          eventbus,
          name =>
            Object.hasOwn(actionLookup, name) ? actionLookup[name] : undefined,
          () => Object.keys(actionLookup),
          addEngineRemover
        );
      }
      if (actionRegistryListener) {
        addEngineRemover(
          eventbus.registerEventlistener(actionRegistryListener)
        );
      }
      addEngineRemover(
        eventbus.registerInterceptor(
          'request-timeline-uri',
          new RequestVideoUriInterceptor(eventbus)
        )
      );

      // Initialize locale manager with locales from configuration
      const {language, locales} = configuration;
      localeManager = new LocaleManager({
        defaultLocale: language as TLanguageCode,
      });

      // Load inline locales now; external ($ref) locales load in the
      // background and engine.init() waits for them.
      const localesReady = this._loadLocales(
        localeManager,
        locales,
        localeLoads.signal
      );

      engineInstance = new EngineClass(
        resolvedConfiguration,
        eventbus,
        timelineProviders,
        localeManager,
        timelineProvidersByUri,
        localesReady,
        this._options?.engineOptions
      );

      // Create and connect adapters
      engineInputAdapter = new EngineInputAdapter(
        engineInstance,
        eventbus,
        this._windowRef,
        {playToggleHotkey: this._options?.playToggleHotkey}
      );
      adapters = [
        new EngineEventbusAdapter(engineInstance, eventbus),
        new LocaleEventbusAdapter(localeManager, eventbus, engineInstance),
        engineInputAdapter,
      ];
      adapters.forEach(adapter => adapter.connect());
      // Also when the engine is destroyed without the returned destroy().
      engineInstance.on('destroyed', () => localeLoads.abort());
    } catch (error) {
      localeLoads.abort();
      adapters.forEach(adapter => adapter.disconnect());
      removeEngineRegistrations();
      throw error;
    }

    liveEngineCount++;
    if (!ownsEventbus) {
      this._liveSharedEngines++;
    }

    let destroyPromise: Promise<void> | undefined;
    const destroyEngine = async () => {
      // Stop external input first, so no key press restarts playback.
      engineInputAdapter.disconnect();
      // A pending locale load must not resume after destroy.
      localeLoads.abort();

      try {
        // Destroy the engine while the eventbus adapters are still
        // connected: end operations need their request responders (for
        // example 'request-engine-root' for selectElement).
        // engineInstance.destroy() also destroys the localeManager.
        await engineInstance.destroy();
      } finally {
        adapters.forEach(adapter => adapter.disconnect());
        removeEngineRegistrations();
        liveEngineCount--;
        if (!ownsEventbus) {
          this._liveSharedEngines--;
        }
        // The global data store is shared by every engine on the page,
        // so only clear it once no engine is left to use it.
        if (liveEngineCount === 0) {
          clearGlobals();
          clearJsonCache();
        }
      }
    };

    // Return the factory result
    return {
      engine: engineInstance,
      localeManager,
      eventbus,
      destroy: () => {
        // Calling it again returns the first call's promise.
        destroyPromise ??= destroyEngine();
        return destroyPromise;
      },
    };
  }

  /**
   * Loads the configured locales into the locale manager.
   *
   * Inline locale data is loaded synchronously. Entries that reference an
   * external file (`{$ref: '...'}`) are fetched with {@link LocaleLoader},
   * with a timeout per file and `signal` to abort them.
   *
   * @param localeManager - The manager to load the locales into
   * @param locales - The configured locales
   * @param signal - Aborts the external loads; once aborted, nothing more is
   * loaded into the manager
   * @returns A promise that settles when the external locales are loaded, or
   * undefined when there are none. It rejects with an error naming the locale
   * that failed.
   */
  private _loadLocales(
    localeManager: LocaleManager,
    locales: ILocalesConfiguration | undefined,
    signal: AbortSignal
  ): Promise<void> | undefined {
    if (!locales) {
      return undefined;
    }

    const references = new Map<TLanguageCode, ILocaleReference>();
    for (const [locale, entry] of Object.entries(locales)) {
      if (isLocaleReference(entry)) {
        references.set(locale as TLanguageCode, entry);
      } else {
        localeManager.loadLocale(locale as TLanguageCode, entry);
      }
    }

    if (references.size === 0) {
      return undefined;
    }

    const loader = new LocaleLoader({
      timeoutMs: LOCALE_LOAD_TIMEOUT_MS,
      signal,
    });
    const loads = [...references].map(([locale, reference]) =>
      loader.load(locale, reference).then(
        result => {
          if (signal.aborted) {
            throw new Error(
              `[EngineFactory] Loading locale '${locale}' was aborted because the engine was destroyed`
            );
          }
          localeManager.loadLocale(result.locale, result.data);
        },
        (error: unknown) => {
          const message =
            error instanceof Error ? error.message : String(error);
          throw new Error(
            `[EngineFactory] Failed to load locale '${locale}' from '${reference.$ref}': ${message}`,
            {cause: error}
          );
        }
      )
    );
    const ready = Promise.all(loads).then(() => undefined);
    // An engine that is never initialised must not cause an unhandled
    // rejection; init() still receives the rejection through `ready`.
    ready.catch(() => {});
    return ready;
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
   * 1. Finding the first timeline that matches the type, skipping timelines
   *    whose `positionSource` override changes the type's settings (when
   *    every timeline of the type has one, the first timeline is used)
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

    const result = Object.entries(timelineProviderSettings ?? {}).reduce<
      Record<TimelineTypes, ITimelineProviderInfo>
    >(
      (acc, [timelineType, settings]) => {
        if (!settings) {
          return acc;
        }

        // The first timeline of this type that uses the type's position
        // source settings unchanged
        const matchingTimeline = representativeTimeline(
          timelines,
          timelineType as TimelineTypes,
          settings
        );
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

  /**
   * Creates the timeline provider for every timeline, keyed by timeline URI.
   *
   * The first timeline of each type reuses the provider created for that type
   * by {@link createTimelineProvidersForConfig}. Every other timeline gets its
   * own position source, constructed with its own duration, and shares the
   * type's container provider and playlist.
   *
   * A timeline whose `positionSource` or `containerProvider` override changes
   * the settings of its type gets that component built from the merged
   * settings (see `ITimelineConfiguration.positionSource`). The
   * components it does not override, and the playlist, come from its type.
   *
   * Position sources that render their own DOM container (they implement
   * `IContainerProvider`, like VideoPositionSource) take their duration from
   * the media rather than from the timeline. They are shared by all timelines
   * of a type with the same effective settings, so switching timelines does
   * not create a second player; a timeline whose override changes the video
   * settings gets a player of its own. Overridden container providers are
   * shared the same way.
   *
   * @param configuration - The resolved engine configuration
   * @param providersByType - The providers created per timeline type
   * @returns A record of timeline URIs to their provider info
   * @throws Error when a position source or container provider cannot be
   * imported, or an overridden position source has no `systemName`
   */
  createTimelineProvidersByUri(
    configuration: IResolvedEngineConfiguration,
    providersByType: Record<TimelineTypes, ITimelineProviderInfo>
  ): Record<string, ITimelineProviderInfo> {
    const {timelineProviderSettings, timelines} = configuration;
    const result: Record<string, ITimelineProviderInfo> = {};
    const sharedSources = new Map<string, IPositionSource>();
    const sharedContainers = new Map<string, IContainerProvider | undefined>();

    timelines?.forEach(timeline => {
      const typeProvider: ITimelineProviderInfo | undefined =
        providersByType[timeline.type];
      const settings = timelineProviderSettings?.[timeline.type];
      const ownSource = overridesPositionSource(timeline, settings);
      const ownContainer = overridesContainerProvider(timeline, settings);

      const typeInfo =
        !ownSource && typeProvider && settings
          ? this._typeProviderInfo(timeline, timelines, settings, typeProvider)
          : undefined;
      if (!ownSource && !ownContainer) {
        if (typeInfo) {
          result[timeline.uri] = typeInfo;
        }
        return;
      }

      const positionSource = ownSource
        ? this._overriddenPositionSource(timeline, settings, sharedSources)
        : typeInfo?.positionSource;
      if (!positionSource) {
        return;
      }

      result[timeline.uri] = {
        positionSource,
        containerProvider: ownContainer
          ? this._overriddenContainerProvider(
              timeline,
              settings,
              sharedContainers
            )
          : typeProvider?.containerProvider,
        playlist: typeProvider?.playlist,
      };
    });

    return result;
  }

  /**
   * The provider of a timeline that uses the settings of its type: the type
   * provider itself for the timeline it was created for and for sources with
   * their own container, otherwise a new position source with the timeline's
   * duration next to the type's container provider and playlist.
   */
  private _typeProviderInfo(
    timeline: IResolvedTimelineConfiguration,
    timelines: IResolvedTimelineConfiguration[],
    settings: ITimelineProviderSettings,
    typeProvider: ITimelineProviderInfo
  ): ITimelineProviderInfo {
    if (
      representativeTimeline(timelines, timeline.type, settings) === timeline ||
      hasIntrinsicContainer(typeProvider.positionSource)
    ) {
      return typeProvider;
    }
    return {
      positionSource: this.createPositionSourceForTimeline(timeline, settings),
      containerProvider: typeProvider.containerProvider,
      playlist: typeProvider.playlist,
    };
  }

  /**
   * Creates the position source of a timeline from its override merged over
   * the type's settings. Sources with their own container are shared by the
   * timelines of a type with the same merged settings.
   */
  private _overriddenPositionSource(
    timeline: IResolvedTimelineConfiguration,
    settings: ITimelineProviderSettings | undefined,
    sharedSources: Map<string, IPositionSource>
  ): IPositionSource {
    const config = effectivePositionSource(timeline, settings);
    if (!config || typeof config.systemName !== 'string') {
      throw new Error(
        `Timeline '${timeline.uri}' has a positionSource override without a systemName, and there are no timelineProviderSettings.${timeline.type} to merge it over.`
      );
    }
    const timelineSettings: ITimelineProviderSettings = {
      positionSource: config as IPositionSourceConfig,
    };
    const SourceClass = this._importSystemEntry(config.systemName);
    if (!isIntrinsicContainerClass(SourceClass)) {
      return this.createPositionSourceForTimeline(timeline, timelineSettings);
    }

    const key = `${timeline.type}:${providerConfigKey(config)}`;
    let source = sharedSources.get(key);
    if (!source) {
      source = this.createPositionSourceForTimeline(timeline, timelineSettings);
      sharedSources.set(key, source);
    }
    return source;
  }

  /**
   * Creates the container provider of a timeline from its override merged
   * over the type's settings, shared by the timelines of a type with the
   * same merged settings.
   */
  private _overriddenContainerProvider(
    timeline: IResolvedTimelineConfiguration,
    settings: ITimelineProviderSettings | undefined,
    sharedContainers: Map<string, IContainerProvider | undefined>
  ): IContainerProvider | undefined {
    const config = effectiveContainerProvider(timeline, settings);
    const key = `${timeline.type}:${providerConfigKey(config)}`;
    if (!sharedContainers.has(key)) {
      sharedContainers.set(
        key,
        this.createContainerProviderForTimeline({
          container: config,
        } as ITimelineProviderSettings)
      );
    }
    return sharedContainers.get(key);
  }
}

function unknownActionMessage(name: string, knownNames: string[]): string {
  const suggestion = formatDidYouMean(findClosestNames(name, knownNames));
  return `Unknown action '${name}'. ${
    suggestion || 'Check the action name in the configuration.'
  }`;
}

function hasIntrinsicContainer(source: IPositionSource): boolean {
  const candidate = source as Partial<IContainerProvider>;
  return (
    typeof candidate.getContainer === 'function' &&
    typeof candidate.onContainerReady === 'function'
  );
}

/**
 * Whether instances of the position source class render their own container,
 * judged from its prototype so no instance is needed.
 */
function isIntrinsicContainerClass(SourceClass: unknown): boolean {
  const prototype = (SourceClass as {prototype?: unknown})?.prototype;
  return (
    typeof prototype === 'object' &&
    prototype !== null &&
    hasIntrinsicContainer(prototype as IPositionSource)
  );
}

/**
 * The timeline the provider of a type is created for: the first timeline of
 * the type that uses the type's position source settings unchanged, or the
 * first timeline of the type when every one of them overrides them.
 */
function representativeTimeline(
  timelines: IResolvedTimelineConfiguration[],
  type: TimelineTypes,
  settings: ITimelineProviderSettings
): IResolvedTimelineConfiguration | undefined {
  const ofType = timelines.filter(t => t.type === type);
  return (
    ofType.find(t => !overridesPositionSource(t, settings)) ?? ofType.at(0)
  );
}
