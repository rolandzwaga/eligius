import type {IAction} from '@action/types.ts';
import type {
  IEngineConfiguration,
  IResolvedEngineConfiguration,
} from '@configuration/types.ts';
import type {IEventbus, IEventbusListener} from '@eventbus/types.ts';
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
   * The hotkey that toggles playback (hotkeys-js syntax), or `false` for
   * none. Defaults to `'space'`.
   */
  playToggleHotkey?: string | false;
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
 */
export interface IResourceImporter extends ISimpleResourceImporter {
  getOperationNames(): string[];
  getControllerNames(): string[];
  getProviderNames(): string[];
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
