import type {IAction} from '@action/types.ts';
import type {
  IEngineConfiguration,
  IResolvedEngineConfiguration,
} from '@configuration/types.ts';
import type {IController} from '@controllers/types.ts';
import type {IEventbus, IEventbusListener} from '@eventbus/types.ts';
import type {TOperation, TOperationData} from '@operation/types.ts';
import type {
  IContainerProvider,
  IPlaylist,
  IPositionSource,
} from '@timelineproviders/types.ts';
import type {ILocaleManager, TLanguageCode} from './locale/types.ts';

// ═══════════════════════════════════════════════════════════════════════════
// Engine Event Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Event map for EligiusEngine
 * Maps event names to their argument tuples
 *
 * Note: Must be a `type` alias (not `interface`) for TypedEventEmitter constraint
 */
export type EngineEvents = {
  /** Playback started */
  start: [];

  /** Playback paused */
  pause: [];

  /** Playback stopped */
  stop: [];

  /** Timeline position changed */
  time: [position: number];

  /** Duration became available */
  duration: [duration: number];

  /** Seek operation initiated */
  seekStart: [target: number, current: number, duration: number];

  /** Seek operation completed */
  seekComplete: [position: number, duration: number];

  /** Timeline switched to different URI */
  timelineChange: [uri: string];

  /** Timeline playback completed */
  timelineComplete: [];

  /** First frame of timeline rendered */
  timelineFirstFrame: [];

  /** Timeline looped/restarted */
  timelineRestart: [];

  /** Engine initialization completed */
  initialized: [];

  /** Engine destroyed */
  destroyed: [];

  /**
   * A timeline action that the engine started or ended on its own (from a
   * position update, `seek()`, `switchTimeline()`, `stop()` or
   * `request-timeline-cleanup`) failed. While nothing but forward-only
   * subscriptions listen to this event, the engine also logs the error
   * message and its cause.
   *
   * A timeline switch that a position source requested (KeyboardStepSource
   * in `timeline-switch` mode) and that failed is reported here as well,
   * with `actionId` `'timeline-change-request'`, `actionName`
   * `"switchTimeline('<uri>')"` and `phase` `'start'`.
   */
  error: [error: IEngineActionError];
};

/**
 * Options for a subscription made with {@link IEligiusEngine.on}.
 */
export interface IEngineEventSubscriptionOptions {
  /**
   * The handler only passes the event on (EngineEventbusAdapter broadcasts
   * `error` as `engine-error`). Such a subscription to `error` does not count
   * as handling it, so the engine still logs errors while nothing else
   * subscribes.
   */
  forwardOnly?: boolean;
}

/**
 * Options for {@link EligiusEngine}.
 */
export interface IEligiusEngineOptions {
  /**
   * Largest forward jump of the playhead, in seconds, whose skipped actions
   * are started and ended one by one. A larger jump (a background tab that
   * becomes visible again, a scrubbed video, a dragged scrollbar) is handled
   * like a seek: the actions covering the new position are started and the
   * others ended, and actions whose whole range was skipped do not run.
   *
   * Defaults to `Infinity`: every skipped action runs.
   */
  maxCatchUp?: number;
}

/**
 * The phase of an action in which an error occurred.
 */
export type TActionPhase = 'start' | 'end';

/**
 * Error reported through the engine's `error` event (and the `engine-error`
 * eventbus event) when a timeline action dispatched by the engine fails.
 *
 * The message names the action, the phase and, when the original error
 * carries it, the operation, followed by the original message.
 */
export interface IEngineActionError extends Error {
  /** Name of the failing action */
  readonly actionName: string;
  /** Id of the failing action */
  readonly actionId: string;
  /** Whether the start or the end operations failed */
  readonly phase: TActionPhase;
  /** System name of the failing operation, when known */
  readonly operationSystemName?: string;
  /** Index of the failing operation in its operation list, when known */
  readonly operationIndex?: number;
  /** The original error */
  readonly cause: unknown;
}

export type KeysOfType<T, U> = {
  [P in keyof T]-?: T[P] extends U | undefined ? P : never;
}[keyof T];

// ═══════════════════════════════════════════════════════════════════════════
// Engine Factory Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Result of creating an engine via the factory
 */
export interface IEngineFactoryResult {
  /** The engine instance */
  engine: IEligiusEngine;

  /** The locale manager instance for translations */
  localeManager: ILocaleManager;

  /**
   * The engine's eventbus: one of its own, or the eventbus passed to the
   * factory in {@link IEngineFactoryOptions.eventbus}. An eventbus of its own
   * is cleared when the engine is destroyed.
   */
  eventbus: IEventbus;

  /**
   * Destroy everything - engine, adapters, and cleanup. Calling it again
   * returns the promise of the first call.
   */
  destroy: () => Promise<void>;
}

/**
 * Describes an object that is capable of processing the given configuration and constructing an IEligiusEngine
 * based on this configuration.
 */
export interface IEngineFactory {
  /**
   * Create a fully wired engine with adapters
   * @param configuration - Engine configuration
   * @param resolver - Optional custom configuration resolver
   * @returns Engine result with engine, language manager, eventbus, and destroy function
   */
  createEngine(
    configuration: IEngineConfiguration,
    resolver?: IConfigurationResolver
  ): IEngineFactoryResult;

  /**
   * Destroy the factory and its resources
   */
  destroy(): void;
}

export interface IEngineFactoryOptions {
  /**
   * An eventbus for every engine the factory creates. Without it, each
   * engine gets its own eventbus (returned as
   * {@link IEngineFactoryResult.eventbus}), so engines never answer each
   * other's requests or react to each other's commands.
   *
   * Use one live engine per eventbus: request responders such as
   * `request-engine-root` are answered by the first engine that registered
   * them, and commands such as `timeline-play-request` reach every engine on
   * the bus. The factory warns when a second engine is created on a shared
   * eventbus while another one is live.
   */
  eventbus?: IEventbus;
  /**
   * Options passed to every engine the factory creates.
   */
  engineOptions?: IEligiusEngineOptions;
  /**
   * Keyboard and window input bindings for every engine the factory
   * creates. Leave it out for the defaults: space toggles playback, and a
   * window resize broadcasts `timeline-resize`.
   *
   * @example
   * ```ts
   * // An embedded widget: no page-wide space key, no resize listener
   * new EngineFactory(importer, window, {
   *   input: {playToggle: 'k', scope: 'engineRoot', resize: false},
   * });
   * ```
   */
  input?: IEngineInputOptions;
  /**
   * The hotkey that toggles playback (hotkeys-js syntax), or `false` for
   * none. Defaults to `'space'`. `input.playToggle` wins when both are set.
   *
   * @deprecated Use {@link IEngineInputOptions.playToggle | input.playToggle}.
   */
  playToggleHotkey?: string | false;
}

/**
 * Where the play toggle hotkey of an engine listens:
 * - `'document'`: while the focus is inside the engine root, or while
 *   nothing has focus. When several engines on a page bind the same key,
 *   a press while nothing has focus toggles only one of them: the engine
 *   the user last clicked or focused inside, otherwise the first one
 *   created.
 * - `'engineRoot'`: only while the focus is inside the engine root.
 *
 * In both scopes the key is left alone while the focus is on a button,
 * link or form field, or before the engine has an active timeline.
 */
export type TEngineInputScope = 'document' | 'engineRoot';

/**
 * Keyboard and window input bindings of a factory-created engine; see
 * {@link IEngineFactoryOptions.input}.
 */
export interface IEngineInputOptions {
  /**
   * The hotkey that toggles playback, in hotkeys-js syntax (for example
   * `'space'`, `'k'` or `'ctrl+p, command+p'`), or `false` for none.
   * Defaults to `'space'`.
   *
   * The key is bound in the hotkeys-js `'all'` scope, so it keeps working
   * whatever scope a KeyboardStepSource or the host page sets. The
   * hotkeys-js global `filter` still applies.
   *
   * A `KeyboardController` of the engine that binds the same key takes it
   * over: a press the controller handles runs its actions and does not
   * toggle playback.
   */
  playToggle?: string | false;
  /**
   * Whether a (debounced) window resize broadcasts `timeline-resize`.
   * Defaults to `true`.
   */
  resize?: boolean;
  /**
   * Where the play toggle hotkey listens; see {@link TEngineInputScope}.
   * Defaults to `'document'`.
   */
  scope?: TEngineInputScope;
}

/**
 * The Eligius timeline engine with explicit, testable API
 */
export interface IEligiusEngine {
  // ─────────────────────────────────────────────────────────────────────────
  // STATE (synchronous reads)
  // ─────────────────────────────────────────────────────────────────────────

  /** Current timeline position in seconds */
  readonly position: number;

  /** Timeline duration in seconds, undefined if not yet available */
  readonly duration: number | undefined;

  /** Current playback state */
  readonly playState: 'playing' | 'paused' | 'stopped';

  /** URI of the currently active timeline */
  readonly currentTimelineUri: string;

  /** Container element for the active timeline provider */
  readonly container: JQuery<HTMLElement> | undefined;

  /** Root element of the engine (container selector) */
  readonly engineRoot: JQuery<HTMLElement>;

  // ─────────────────────────────────────────────────────────────────────────
  // EVENTS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Subscribe to engine events
   * @param event - Event name
   * @param handler - Event handler
   * @param options - Optional subscription options
   * @returns Unsubscribe function
   */
  on<K extends keyof EngineEvents>(
    event: K,
    handler: (...args: EngineEvents[K]) => void,
    options?: IEngineEventSubscriptionOptions
  ): () => void;

  // ─────────────────────────────────────────────────────────────────────────
  // LIFECYCLE
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Initialize the engine
   * Creates layout, initializes timeline provider, executes init actions
   * @returns The initialized position source
   */
  init(): Promise<IPositionSource>;

  /**
   * Destroy the engine
   * Cleans up resources, ends actions, removes event listeners
   */
  destroy(): Promise<void>;

  // ─────────────────────────────────────────────────────────────────────────
  // PLAYBACK COMMANDS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Start playback
   * @throws If autoplay is blocked (video provider)
   */
  start(): Promise<void>;

  /**
   * Pause playback
   */
  pause(): void;

  /**
   * Stop playback and reset to beginning.
   *
   * Playback stops synchronously. Implementations may return a promise that
   * resolves once the active timeline actions have been ended
   * (EligiusEngine does).
   */
  stop(): void | Promise<void>;

  /**
   * Seek to a specific position
   * @param position - Target position in seconds
   * @returns Actual position after seek
   */
  seek(position: number): Promise<number>;

  // ─────────────────────────────────────────────────────────────────────────
  // TIMELINE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Switch to a different timeline
   * @param uri - Timeline URI to switch to
   * @param position - Optional starting position
   */
  switchTimeline(uri: string, position?: number): Promise<void>;
}

/**
 * Describes an object that acts as a registry for imported resources.
 *
 * The engine looks up every system name through it: the engine class,
 * operations, controllers, timeline providers, the functions that
 * `customFunction` calls, the values that `getImport` returns, and the
 * values of `template:` and `json:` placeholders.
 *
 * Most hosts do not implement it. `EligiusResourceImporter` provides all of
 * Eligius' own resources, and its constructor accepts custom operations,
 * functions, controllers, templates and JSON (see
 * {@link IEligiusResourceRegistrations}). Implement this interface only for
 * resources that cannot be registered that way, such as a custom position
 * source, and delegate the other names to an `EligiusResourceImporter`.
 */
export interface ISimpleResourceImporter {
  /**
   * Returns the resource registered under `name`, as `{[name]: value}`.
   *
   * For a name it does not know, an importer should throw an error that names
   * it (`EligiusResourceImporter` does, with a "did you mean" hint). Returning
   * a record without a value for `name` is also accepted. The engine treats
   * both as an unknown name: the configuration resolver reports the JSON path,
   * and `customFunction` and `getImport` report the operation.
   *
   * @param name - The system name to look up
   * @returns A record whose `name` key holds the resource
   * @throws Error when `name` is unknown (recommended, not required)
   */
  import(name: string): Record<string, any>;
}

/**
 * Describes an object that acts as a registry for imported resources and
 * is able to return all of the registered operation, controller and provider names.
 *
 * The configuration resolver uses these lists to tell an operation from a
 * controller or provider export, and to suggest the closest names ("did you
 * mean") for an unknown operation name. Each list should include the custom
 * resources the importer provides.
 */
export interface IResourceImporter extends ISimpleResourceImporter {
  /**
   * @returns The system names of every operation the importer provides
   */
  getOperationNames(): string[];
  /**
   * @returns The system names of every controller the importer provides
   */
  getControllerNames(): string[];
  /**
   * @returns The system names of every timeline provider export the importer
   * provides
   */
  getProviderNames(): string[];
  /**
   * Optional. When present, the configuration resolver rejects these names as
   * an operation `systemName` and points to the `customFunction` operation.
   *
   * @returns The system names of the custom functions the importer provides
   */
  getFunctionNames?(): string[];
}

/**
 * A controller class that can be registered with the
 * `EligiusResourceImporter`. The engine constructs a new instance, with
 * the eventbus as its only argument, each time the `getControllerInstance`
 * operation asks for it.
 */
export type TControllerClass = new (
  ...args: any[]
) => IController<TOperationData>;

/**
 * Custom resources to register with the `EligiusResourceImporter`, keyed
 * by system name.
 *
 * Every name has to be unique across all the maps. A name that is already
 * provided by Eligius itself (an operation, controller, timeline provider,
 * eventbus export or `EligiusEngine`) is rejected, unless `override` is `true`.
 *
 * @example
 * ```ts
 * const importer = new EligiusResourceImporter({
 *   operations: {trackEvent},
 *   functions: {formatPrice: data => {data.price = `€ ${data.amount}`;}},
 *   controllers: {ChartController},
 *   templates: {intro: '<div class="intro"></div>'},
 *   json: {chartData: {labels: ['a', 'b'], values: [1, 2]}},
 * });
 * ```
 */
export interface IEligiusResourceRegistrations {
  /**
   * Custom operations, usable as an operation `systemName` in a
   * configuration. Each value must be an operation function (`TOperation`),
   * not a class.
   */
  operations?: Readonly<Record<string, TOperation<any, any>>>;
  /**
   * Custom functions for the `customFunction` operation. Each value must be a
   * function, not a class. `getImport` can retrieve them as well.
   */
  functions?: Readonly<Record<string, (...args: any[]) => unknown>>;
  /**
   * Custom controllers for the `getControllerInstance` and
   * `addControllerToElement` operations. Each value must be a class that
   * implements {@link IController} (`name`, `init`, `attach` and `detach`).
   */
  controllers?: Readonly<Record<string, TControllerClass>>;
  /**
   * HTML templates for `template:<name>` placeholders in a configuration. Each
   * value must be a string. `getImport` can retrieve them as well.
   */
  templates?: Readonly<Record<string, string>>;
  /**
   * Data for `json:<name>` placeholders in a configuration (the configuration
   * receives a copy). `getImport` can retrieve them as well. A value may be
   * anything that is not `undefined`, a function, a symbol or a bigint.
   */
  json?: Readonly<Record<string, unknown>>;
  /**
   * When `true`, a registered name may replace a resource that Eligius itself
   * provides, for example a custom `selectElement` operation. Defaults to
   * `false`, so a clash with a built-in name throws.
   */
  override?: boolean;
}

/**
 * A class the `EngineFactory` instantiates as the engine named by
 * `configuration.engine.systemName`.
 */
export type TEngineClass = new (...args: any[]) => IEligiusEngine;

/**
 * A timeline provider class: a position source, a container provider or a
 * playlist, named by `systemName` in `timelineProviderSettings` or a
 * timeline's `positionSource` / `containerProvider` override.
 */
export type TProviderClass = new (
  ...args: any[]
) => IPositionSource | IContainerProvider | IPlaylist;

/**
 * The resources a `createImporter` importer provides, keyed by system name.
 *
 * The maps are the {@link IEligiusResourceRegistrations} maps without
 * `override` (there are no built-in names to override), plus the engine and
 * timeline provider classes that the default importer provides on its own.
 * Every name has to be unique across all the maps.
 *
 * @example
 * ```ts
 * const importer = createImporter({
 *   operations: {selectElement, addClass},
 *   providers: {RafPositionSource, DomContainerProvider, SimplePlaylist},
 *   controllers: {LabelController},
 *   templates: {layout: '<div id="stage"></div>'},
 * });
 * ```
 */
export interface IImporterResources
  extends Omit<IEligiusResourceRegistrations, 'override'> {
  /**
   * Engine classes, for `configuration.engine.systemName`. Defaults to
   * `{EligiusEngine}`.
   */
  engines?: Readonly<Record<string, TEngineClass>>;
  /**
   * Position sources, container providers and playlists, for the
   * `systemName` values in `timelineProviderSettings` and the per-timeline
   * overrides.
   */
  providers?: Readonly<Record<string, TProviderClass>>;
}

/**
 * The kind of a registered resource.
 */
export type TRegisteredResourceKind =
  | 'operation'
  | 'function'
  | 'controller'
  | 'template'
  | 'json';

/**
 * A configuration problem that does not stop the resolver, reported through
 * {@link IConfigurationResolverOptions.onWarning}.
 */
export interface IConfigurationWarning {
  /** JSON path of the offending value, for example `actions[0].startOperations[2].systemName` */
  path: string;
  /** What is wrong and what happens at runtime */
  message: string;
}

/**
 * Options for the `ConfigurationResolver` constructor.
 */
export interface IConfigurationResolverOptions {
  /**
   * Receives every configuration warning. Without it, warnings are written
   * with `console.warn`.
   */
  onWarning?: (warning: IConfigurationWarning) => void;
}

export interface IConfigurationResolver {
  process(
    configuration: IEngineConfiguration,
    actionRegistryListener?: IEventbusListener
  ): [Record<string, IAction>, IResolvedEngineConfiguration];
}

export type TResultCallback<T> = (result: T) => void;

/**
 * Describes a duration of time expressed in a start and an optional end range with a one second interval.
 */
export interface IDuration {
  start: number;
  end?: number;
}

/**
 * Describes a duration of time expressed in a start and an end range with a one second interval.
 */
export interface IStrictDuration extends Required<IDuration> {}

/**
 * Describes the different kinds of timeline providers.
 */
export type TimelineTypes = 'animation' | 'mediaplayer';

/**
 * Contains the decomposed components for a timeline provider.
 *
 * Timeline providers are assembled from:
 * - Position source: drives timeline position (required)
 * - Container provider: manages render container (optional)
 * - Playlist: manages multi-item navigation (optional)
 */
export interface ITimelineProviderInfo {
  /** The position source driving timeline position */
  positionSource: IPositionSource;
  /** Optional container provider for DOM element management */
  containerProvider?: IContainerProvider;
  /** Optional playlist for multi-item timelines */
  playlist?: IPlaylist;
}

/**
 *
 * Container type for a width and height
 *
 */
export interface IDimensions {
  width: number;
  height: number;
}

// Re-export TLanguageCode from locale module (canonical location)
export type {TLanguageCode} from './locale/types.ts';

export interface ISubtitleCollection {
  languageCode: TLanguageCode;
  titles: ISubtitle[];
}

export interface ISubtitle {
  id: string;
  duration: IStrictDuration;
  text: string;
}

export type RequireKeys<T, K extends keyof T> = {
  [P in K]-?: T[P];
};
