import type {IEndableAction, ITimelineAction} from '@action/types.ts';
import type * as controllers from '@controllers/index.ts';
import type * as operations from '@operation/index.ts';
import type {TOperation, TOperationData} from '@operation/types.ts';
import type {ILocalesConfiguration} from '../locale/types.ts';
import type {IDuration, TimelineTypes, TLanguageCode} from '../types.ts';

/**
 * Represents a language option for the available languages list.
 * Used for UI elements like language selection dropdowns.
 */
export interface ILabel {
  id: string;
  languageCode: TLanguageCode;
  label: string;
}

export type Controllers = typeof controllers;
export type TControllerName = keyof Controllers;
export type TControllerType = Controllers[TControllerName];
export type GetControllerByName<T extends TControllerName> = Controllers[T];

export type Operations = typeof operations;
export type TOperationName = keyof Operations;
export type TOperationType = Operations[TOperationName];
export type GetOperationByName<T extends TOperationName> = Operations[T];

export type ExtractOperationDataType<P> =
  P extends TOperation<infer T, any> ? T : never;

/**
 * Engine identification information.
 */
export interface IEngineInfo {
  /** Name of the engine system to use */
  systemName: string;
}

/**
 * Provider settings indexed by timeline type.
 * Allows different configurations for 'animation' vs 'mediaplayer' timelines.
 */
export type TTimelineProviderSettings = Partial<
  Record<TimelineTypes, ITimelineProviderSettings>
>;

/**
 * Root configuration for the Eligius timeline engine.
 *
 * This is the main configuration object passed to `EngineFactory.createEngine()`.
 * It defines all aspects of the engine: timelines, actions, language settings, and more.
 *
 * @example
 * ```typescript
 * const config: IEngineConfiguration = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   engine: { systemName: 'EligiusEngine' },
 *   containerSelector: '#eligius-container',
 *   cssFiles: ['styles/main.css'],
 *   language: 'en-US',
 *   layoutTemplate: '<div class="container"></div>',
 *   availableLanguages: [{ id: 'en', languageCode: 'en-US', label: 'English' }],
 *   initActions: [],
 *   actions: [],
 *   timelines: []
 * };
 * ```
 */
export interface IEngineConfiguration {
  /** Unique identifier for the configuration (UUID format) */
  id: string;
  /** Engine identification info */
  engine: IEngineInfo;
  /** Optional settings for timeline providers by type */
  timelineProviderSettings?: TTimelineProviderSettings;
  /** CSS selector for the main container element */
  containerSelector: string;
  /** Array of CSS file paths to load */
  cssFiles: string[];
  /** Default language code (IETF language tag) */
  language: TLanguageCode;
  /** HTML template for the layout (inline HTML or template reference) */
  layoutTemplate: string;
  /** List of available languages for the application */
  availableLanguages: ILabel[];
  /** Actions to execute during engine initialization */
  initActions: IEndableActionConfiguration[];
  /** Reusable action templates */
  actions: IEndableActionConfiguration[];
  /** Optional actions triggered by events */
  eventActions?: IEventActionConfiguration[];
  /** Timeline configurations */
  timelines: ITimelineConfiguration[];
  /** Optional timeline flow configuration for navigation between timelines */
  timelineFlow?: ITimelineFlow;
  /** Locale configuration for rosetta-based translations */
  locales?: ILocalesConfiguration;
}

export interface IResolvedEngineConfiguration {
  id: string;
  engine: IEngineInfo;
  timelineProviderSettings: TTimelineProviderSettings;
  containerSelector: string;
  cssFiles: string[];
  language: TLanguageCode;
  layoutTemplate: string;
  availableLanguages: ILabel[];
  initActions: IEndableAction[];
  actions: IEndableAction[];
  timelines: IResolvedTimelineConfiguration[];
  timelineFlow?: ITimelineFlow;
}

export interface IResolvedActionConfiguration {
  id: string;
  name: string;
  startOperations: IResolvedOperation[];
}

export interface IResolvedEndableActionConfiguration
  extends IResolvedActionConfiguration {
  endOperations: IResolvedOperation[];
}

/**
 * Configuration for timeline flow navigation.
 *
 * Defines how timelines connect and transition between each other.
 * Currently a placeholder type for future implementation.
 */
export type ITimelineFlow = Record<string, never>;

// ─────────────────────────────────────────────────────────────────────────────
// Position Source Configuration Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Configuration for a position source.
 *
 * Position sources drive timeline position. They are resolved dynamically
 * via the resource importer using the `systemName` property.
 *
 * Built-in position sources:
 * - `RafPositionSource`: RAF-based, drives timeline by elapsed time
 * - `ScrollPositionSource`: Scroll-based, drives timeline by scroll position
 * - `VideoPositionSource`: Video.js-based, drives timeline by video playback
 *
 * @example
 * ```typescript
 * // RAF-based position source
 * const rafConfig: IPositionSourceConfig = {
 *   systemName: 'RafPositionSource',
 *   tickInterval: 1000,
 * };
 *
 * // Scroll-based position source
 * const scrollConfig: IPositionSourceConfig = {
 *   systemName: 'ScrollPositionSource',
 *   selector: '.scroll-container',
 * };
 *
 * // Video-based position source
 * const videoConfig: IPositionSourceConfig = {
 *   systemName: 'VideoPositionSource',
 *   selector: '#video-player',
 *   poster: '/poster.jpg',
 * };
 * ```
 */
export interface IPositionSourceConfig {
  /**
   * Name of the position source class to instantiate.
   * Resolved via the resource importer.
   *
   * Built-in options: 'RafPositionSource', 'ScrollPositionSource', 'VideoPositionSource'
   */
  systemName: string;

  /**
   * CSS selector for sources that need a DOM element (scroll, video).
   */
  selector?: string;

  /**
   * Interval between position updates in milliseconds (RAF sources).
   * @default 1000
   */
  tickInterval?: number;

  /**
   * Optional poster image URL (video sources).
   */
  poster?: string;

  /**
   * Additional configuration options passed to the position source constructor.
   * Use this for custom position source implementations.
   */
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// Container Provider Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Configuration for a container provider.
 *
 * Container providers manage DOM elements where timeline content is rendered.
 * They are resolved dynamically via the resource importer using `systemName`.
 *
 * Built-in container providers:
 * - `DomContainerProvider`: Manages a DOM element by selector
 *
 * @example
 * ```typescript
 * const config: IContainerProviderConfig = {
 *   systemName: 'DomContainerProvider',
 *   selector: '#render-area',
 * };
 * ```
 */
export interface IContainerProviderConfig {
  /**
   * Name of the container provider class to instantiate.
   * Resolved via the resource importer.
   *
   * Built-in options: 'DomContainerProvider'
   */
  systemName: string;

  /** CSS selector for the container element */
  selector: string;

  /**
   * Additional configuration options passed to the container provider constructor.
   * Use this for custom container provider implementations.
   */
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// Playlist Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Configuration for a playlist.
 *
 * Playlists manage collections of items (e.g., video chapters) that can be
 * selected and navigated. They are resolved dynamically via the resource
 * importer using `systemName`.
 *
 * Built-in playlists:
 * - `SimplePlaylist`: Basic playlist with array of items
 *
 * @typeParam TItem - The type of items in the playlist
 *
 * @example
 * ```typescript
 * const config: IPlaylistConfig = {
 *   systemName: 'SimplePlaylist',
 *   items: [{ uri: '/video1.mp4' }, { uri: '/video2.mp4' }],
 *   identifierKey: 'uri',
 * };
 * ```
 */
export interface IPlaylistConfig<TItem = unknown> {
  /**
   * Name of the playlist class to instantiate.
   * Resolved via the resource importer.
   *
   * Built-in options: 'SimplePlaylist'
   */
  systemName: string;

  /** The items in the playlist */
  items: TItem[];

  /**
   * Property key used to identify items.
   * Used when selecting items by identifier (e.g., 'uri', 'id', 'chapterId').
   */
  identifierKey: string;

  /**
   * Additional configuration options passed to the playlist constructor.
   * Use this for custom playlist implementations.
   */
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// Timeline Provider Settings
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Settings for a timeline provider.
 *
 * Timeline providers are assembled from decomposed components:
 * - Position source: drives timeline position (required)
 * - Container provider: manages render container (optional)
 * - Playlist: manages multi-item navigation (optional)
 *
 * All components are resolved dynamically via the resource importer using
 * the `systemName` property, allowing custom implementations.
 *
 * @example
 * ```typescript
 * const settings: ITimelineProviderSettings = {
 *   positionSource: { systemName: 'RafPositionSource', tickInterval: 1000 },
 *   container: { systemName: 'DomContainerProvider', selector: '#render-area' },
 * };
 * ```
 */
export interface ITimelineProviderSettings {
  /** Configuration for the position source */
  positionSource: IPositionSourceConfig;
  /** Optional container provider configuration */
  container?: IContainerProviderConfig;
  /** Optional playlist configuration */
  playlist?: IPlaylistConfig;
}

export interface IResolvedTimelineConfiguration {
  id: string;
  uri: string;
  type: TimelineTypes;
  duration: number;
  loop: boolean;
  selector: string;
  timelineActions: ITimelineAction[];
  /**
   * Optional container selector for the timeline.
   * Defaults to the timeline selector if not specified.
   */
  container?: string;
}

/**
 * Configuration for a single timeline.
 *
 * A timeline represents a time-based sequence of actions that can be played,
 * paused, and seeked. Multiple timelines can exist in a configuration.
 *
 * @example
 * ```typescript
 * const timeline: ITimelineConfiguration = {
 *   id: 'main-timeline',
 *   uri: 'timeline://main',
 *   type: 'animation',
 *   duration: 60,
 *   loop: false,
 *   selector: '#timeline-container',
 *   timelineActions: []
 * };
 * ```
 */
export interface ITimelineConfiguration {
  /** Unique identifier for the timeline */
  id: string;
  /** URI for timeline identification and switching */
  uri: string;
  /** Timeline type: 'animation' (RAF-based) or 'mediaplayer' (video-based) */
  type: TimelineTypes;
  /** Duration in seconds */
  duration: number;
  /** Whether the timeline should loop when complete */
  loop: boolean;
  /** CSS selector for the timeline's target element */
  selector: string;
  /** Actions to execute at specific timeline positions */
  timelineActions: ITimelineActionConfiguration[];
  /**
   * Optional container selector for the timeline.
   * Defaults to the timeline selector if not specified.
   * Used by position sources that don't have an intrinsic container.
   */
  container?: string;
}

/**
 * Configuration for an operation within an action.
 *
 * Operations are atomic functions that perform specific tasks
 * (DOM manipulation, data operations, etc.).
 *
 * @typeParam T - The operation data type
 */
export interface IOperationConfiguration<T extends TOperationData> {
  /** Unique identifier for the operation */
  id: string;
  /** Name of the operation to execute (e.g., 'selectElement', 'animateWithClass') */
  systemName: string;
  /** Optional data passed to the operation */
  operationData?: T;
}

/**
 * Base configuration for an action.
 *
 * Actions are named sequences of operations that execute together.
 */
export interface IActionConfiguration {
  /** Unique identifier for the action */
  id: string;
  /** Human-readable name for the action */
  name: string;
  /** Operations to execute when the action starts */
  startOperations: IOperationConfiguration<TOperationData>[];
}

/**
 * Configuration for an action that has both start and end operations.
 *
 * Endable actions execute startOperations when triggered and
 * endOperations when completed or reversed.
 */
export interface IEndableActionConfiguration extends IActionConfiguration {
  /** Operations to execute when the action ends */
  endOperations: IOperationConfiguration<TOperationData>[];
}

/**
 * Configuration for a timeline-bound action with duration.
 *
 * Timeline actions execute at specific time ranges within a timeline.
 */
export interface ITimelineActionConfiguration
  extends IEndableActionConfiguration {
  /** Time range when this action is active (start/end in seconds) */
  duration: IDuration;
}

/**
 * Configuration for an event-triggered action.
 *
 * Event actions execute in response to eventbus events.
 */
export interface IEventActionConfiguration extends IActionConfiguration {
  /** Name of the event that triggers this action */
  eventName: string;
  /** Optional event topic for filtering (defaults to global topic) */
  eventTopic?: string;
}

export interface IResolvedOperation {
  id: string;
  systemName: string;
  operationData: TOperationData;
  instance: TOperation<any>;
}
