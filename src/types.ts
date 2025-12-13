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
};

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

  /** The eventbus for external consumers */
  eventbus: IEventbus;

  /**
   * Destroy everything - engine, adapters, and cleanup
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
  eventbus?: IEventbus;
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
   * @returns Unsubscribe function
   */
  on<K extends keyof EngineEvents>(
    event: K,
    handler: (...args: EngineEvents[K]) => void
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
   * Stop playback and reset to beginning
   */
  stop(): void;

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
