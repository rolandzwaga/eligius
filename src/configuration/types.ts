import type {IEndableAction, ITimelineAction} from '@action/types.ts';
import type * as controllers from '@controllers/index.ts';
import type * as operations from '@operation/index.ts';
import type {TOperation, TOperationData} from '@operation/types.ts';
import type {ILocalesConfiguration} from '../locale/types.ts';
import type {
  IDuration,
  ILabel,
  ILanguageLabel,
  TimelineTypes,
  TLanguageCode,
} from '../types.ts';

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
export interface IEngineInfo {
  systemName: string;
}

export type TTimelineProviderSettings = Partial<
  Record<TimelineTypes, ITimelineProviderSettings>
>;
export interface IEngineConfiguration {
  id: string;
  engine: IEngineInfo;
  timelineProviderSettings?: TTimelineProviderSettings;
  containerSelector: string;
  cssFiles: string[];
  language: TLanguageCode;
  layoutTemplate: string;
  availableLanguages: ILabel[];
  initActions: IEndableActionConfiguration[];
  actions: IEndableActionConfiguration[];
  eventActions?: IEventActionConfiguration[];
  timelines: ITimelineConfiguration[];
  timelineFlow?: ITimelineFlow;
  labels: ILanguageLabel[];
  /** Optional locale configuration for rosetta-based translations */
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
  labels: ILanguageLabel[];
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

export interface ITimelineConfiguration {
  id: string;
  uri: string;
  type: TimelineTypes;
  duration: number;
  loop: boolean;
  selector: string;
  timelineActions: ITimelineActionConfiguration[];
  /**
   * Optional container selector for the timeline.
   * Defaults to the timeline selector if not specified.
   * Used by position sources that don't have an intrinsic container.
   */
  container?: string;
}

export interface IOperationConfiguration<T extends TOperationData> {
  id: string;
  systemName: string;
  operationData?: T;
}

export interface IEventActionConfiguration extends IActionConfiguration {
  eventName: string;
  eventTopic?: string;
}

export interface IActionConfiguration {
  id: string;
  name: string;
  startOperations: IOperationConfiguration<TOperationData>[];
}

export interface IEndableActionConfiguration extends IActionConfiguration {
  endOperations: IOperationConfiguration<TOperationData>[];
}

export interface ITimelineActionConfiguration
  extends IEndableActionConfiguration {
  duration: IDuration;
}

export interface IEventActionConfiguration extends IActionConfiguration {
  eventName: string;
  eventTopic?: string;
}

export interface IResolvedOperation {
  id: string;
  systemName: string;
  operationData: TOperationData;
  instance: TOperation<any>;
}
