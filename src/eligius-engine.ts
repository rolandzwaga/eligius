import type {IAction, IEndableAction, ITimelineAction} from '@action/types.ts';
import type {
  IResolvedEngineConfiguration,
  IResolvedTimelineConfiguration,
} from '@configuration/types.ts';
import type {
  EventName,
  IEventbus,
  TEventbusRemover,
  TEventHandler,
} from '@eventbus/types.ts';
import {detachControllersWithin} from '@operation/helper/detach-controllers-within.ts';
import type {
  IContainerProvider,
  IPlaylist,
  IPositionSource,
  ISeekable,
} from '@timelineproviders/types.ts';
import {TypedEventEmitter} from '@util/typed-event-emitter.ts';
import $ from 'jquery';
import type {ILocaleManager} from './locale/types.ts';
import type {
  EngineEvents,
  IEligiusEngine,
  IEngineActionError,
  ITimelineProviderInfo,
  TActionPhase,
  TimelineTypes,
  TResultCallback,
} from './types.ts';

// ─────────────────────────────────────────────────────────────────────────────
// Errors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Error emitted through the engine's `error` event when a timeline action that
 * the engine started or ended on its own fails.
 *
 * The original error is kept as `cause`. When it carries
 * `operationSystemName` and `operationIndex` properties, they are copied, and
 * the message names the operation.
 *
 * @example
 * ```typescript
 * engine.on('error', error => {
 *   reportToMonitoring(error.message, error.cause);
 * });
 * // error.message: "Error in action start 'ShowTitle': ..."
 * ```
 */
export class EngineActionError extends Error implements IEngineActionError {
  readonly actionName: string;
  readonly actionId: string;
  readonly phase: TActionPhase;
  readonly operationSystemName?: string;
  readonly operationIndex?: number;
  readonly cause: unknown;

  /**
   * @param action - The failing action
   * @param phase - Whether its start or its end operations failed
   * @param cause - The original error
   */
  constructor(
    action: Pick<IAction, 'id' | 'name'>,
    phase: TActionPhase,
    cause: unknown
  ) {
    const {operationSystemName, operationIndex} = readOperationContext(cause);
    const operation =
      operationSystemName === undefined
        ? ''
        : ` at operation '${operationSystemName}'${
            operationIndex === undefined ? '' : ` (index ${operationIndex})`
          }`;
    super(
      `Error in action ${phase} '${action.name}'${operation}: ${describeCause(cause)}`
    );
    this.name = 'EngineActionError';
    this.actionName = action.name;
    this.actionId = action.id;
    this.phase = phase;
    this.operationSystemName = operationSystemName;
    this.operationIndex = operationIndex;
    this.cause = cause;
  }
}

function readOperationContext(cause: unknown): {
  operationSystemName?: string;
  operationIndex?: number;
} {
  if (typeof cause !== 'object' || cause === null) {
    return {};
  }
  const {operationSystemName, operationIndex} = cause as Record<
    string,
    unknown
  >;
  return {
    operationSystemName:
      typeof operationSystemName === 'string' ? operationSystemName : undefined,
    operationIndex:
      typeof operationIndex === 'number' ? operationIndex : undefined,
  };
}

function describeCause(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

// ─────────────────────────────────────────────────────────────────────────────
// Type Guards
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Type guard to check if a position source supports seeking.
 */
function isSeekable(
  source: IPositionSource
): source is IPositionSource & ISeekable {
  return 'seek' in source && typeof (source as ISeekable).seek === 'function';
}

/**
 * Maps position source state to engine play state.
 */
function mapSourceStateToPlayState(
  sourceState: IPositionSource['state']
): 'playing' | 'paused' | 'stopped' {
  switch (sourceState) {
    case 'active':
      return 'playing';
    case 'suspended':
      return 'paused';
    case 'inactive':
      return 'stopped';
  }
}

type ActionMethod =
  | (IEndableAction['start'] & ActionMethodMetadata)
  | (IEndableAction['end'] & ActionMethodMetadata);

interface ActionMethodMetadata {
  id: string;
  isStart: boolean;
  startPosition?: number;
}

/**
 * A start or end of a timeline action at a position on the timeline.
 */
interface IScheduledActionEvent {
  position: number;
  isStart: boolean;
  /**
   * Order among events at the same position: ends (0) before starts (1), so an
   * action ending at 5 is ended before one starting at 5 is started. The end
   * of a zero-length action (2) comes after its own start.
   */
  order: 0 | 1 | 2;
  action: ITimelineAction;
}

/**
 * A start that a position update decided on but has not run yet, because it
 * waits for the ends of the same update to finish.
 */
interface IPendingStart {
  action: ITimelineAction;
  /** The update that passed its end came before the start could run */
  endAfterStart: boolean;
}

const noop = () => {};

/**
 * Whether the action is in effect at the given position. Ranges are
 * half-open, `[start, end)`, so an action is ended exactly when the playhead
 * reaches its end, which matches what the position callback does.
 */
function coversPosition(action: ITimelineAction, position: number) {
  return action.duration.start <= position && position < action.duration.end;
}

/**
 * Index of the first event whose position is greater than `position`.
 */
function upperBound(events: IScheduledActionEvent[], position: number) {
  let low = 0;
  let high = events.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (events[middle].position <= position) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }
  return low;
}

/**
 * The Eligius timeline engine with explicit, testable API.
 *
 * This engine is responsible for starting and stopping the given timeline provider
 * and triggering the actions associated with positions along the timeline.
 *
 * The engine reports its state through its own event emitter (see
 * {@link EngineEvents}). Mapping those events to eventbus broadcasts, and
 * eventbus commands such as `timeline-play-request` to engine calls, is done
 * by {@link EngineEventbusAdapter}, which {@link EngineFactory.createEngine}
 * connects. An engine constructed directly needs that adapter connected to be
 * driven through the eventbus.
 */
export class EligiusEngine implements IEligiusEngine {
  /**
   * Per timeline URI, every start and end of its timeline actions, sorted once
   * by position. Position updates process the slice between the previous and
   * the current position with a binary search, so tick cost does not depend on
   * the number of actions.
   */
  private _timelineSchedules: Map<string, IScheduledActionEvent[]> = new Map();
  private _timelineLookupCache: Map<string, IResolvedTimelineConfiguration> =
    new Map();
  private _eventbusRemovers: TEventbusRemover[] = [];
  private _currentTimelineUri: string = '';

  // Decomposed timeline provider components
  private _activePositionSource: IPositionSource | undefined = undefined;
  private _activeContainerProvider: IContainerProvider | undefined = undefined;
  private _activePlaylist: IPlaylist | undefined = undefined;

  /** Position sources whose callbacks are registered and that are init()ed */
  private _preparedSources: Set<IPositionSource> = new Set();
  /** Container providers that are init()ed */
  private _preparedContainers: Set<IContainerProvider> = new Set();

  private _lastPosition: number = -1;
  /** Position updates are ignored while a seek is in progress */
  private _seekDepth = 0;
  /** End operations started by stop() that start() waits for */
  private _pendingStopCleanup: Promise<void> | undefined = undefined;
  /** Serialises timeline switches */
  private _switchQueue: Promise<void> = Promise.resolve();
  /**
   * Starts waiting for the ends of their position update. Seeking, stopping,
   * switching, cleanup and destroy clear it, which cancels them.
   */
  private _pendingStarts: Map<ITimelineAction, IPendingStart> = new Map();
  /** Live `error` subscriptions, to log errors nobody listens to */
  private _errorSubscriptions: Set<object> = new Set();
  private _emitter = new TypedEventEmitter<EngineEvents>();

  // ─────────────────────────────────────────────────────────────────────────
  // STATE (synchronous reads) - IEligiusEngine interface
  // ─────────────────────────────────────────────────────────────────────────

  /** Current timeline position in seconds (supports fractional values) */
  get position(): number {
    return this._activePositionSource?.getPosition() ?? 0;
  }

  /** Timeline duration in seconds, undefined if not yet available */
  get duration(): number | undefined {
    return this._activePositionSource?.getDuration();
  }

  /** Current playback state (derived from position source state) */
  get playState(): 'playing' | 'paused' | 'stopped' {
    if (!this._activePositionSource) {
      return 'stopped';
    }
    return mapSourceStateToPlayState(this._activePositionSource.state);
  }

  /** URI of the currently active timeline */
  get currentTimelineUri(): string {
    return this._currentTimelineUri;
  }

  /** Container element for the active timeline provider */
  get container(): JQuery<HTMLElement> | undefined {
    return this._activeContainerProvider?.getContainer();
  }

  /** Root element of the engine (container selector) */
  get engineRoot(): JQuery<HTMLElement> {
    return $(this.configuration.containerSelector);
  }

  /**
   * @param configuration - The resolved engine configuration
   * @param eventbus - The eventbus, used for the callback-style state queries
   * @param timelineProviders - Timeline providers per timeline type
   * @param localeManager - The locale manager, destroyed with the engine
   * @param timelineProvidersByUri - Optional timeline providers per timeline
   * URI. When a timeline's URI has an entry it is used instead of the
   * provider for its type, so timelines of the same type can each have their
   * own position source (and duration).
   * @param localesReady - Optional promise that settles when externally
   * referenced (`$ref`) locales have been loaded into the locale manager.
   * {@link init} waits for it before running init actions, so labels can be
   * translated, and rejects if loading failed.
   */
  constructor(
    private configuration: IResolvedEngineConfiguration,
    private eventbus: IEventbus,
    private timelineProviders: Record<TimelineTypes, ITimelineProviderInfo>,
    private localeManager: ILocaleManager,
    private timelineProvidersByUri?: Record<string, ITimelineProviderInfo>,
    private localesReady?: Promise<void>
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // EVENTS - IEligiusEngine interface
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Subscribe to engine events.
   *
   * Errors of timeline actions that the engine starts or ends on its own are
   * reported through the `error` event; while it has no subscribers they are
   * logged with `console.error` instead.
   *
   * @param event - Event name
   * @param handler - Event handler
   * @returns Unsubscribe function
   */
  on<K extends keyof EngineEvents>(
    event: K,
    handler: (...args: EngineEvents[K]) => void
  ): () => void {
    const unsubscribe = this._emitter.on(event, handler);
    if (event !== 'error') {
      return unsubscribe;
    }

    const subscription = {};
    this._errorSubscriptions.add(subscription);
    return () => {
      this._errorSubscriptions.delete(subscription);
      unsubscribe();
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PLAYBACK COMMANDS - IEligiusEngine interface
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Start playback
   * @throws If autoplay is blocked (video provider)
   */
  async start(): Promise<void> {
    const source = this._activePositionSource;
    if (!source) {
      return;
    }

    if (this._pendingStopCleanup) {
      await this._pendingStopCleanup;
    }

    await source.activate();
    this._emitter.emit('start');
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this._activePositionSource) {
      return;
    }

    this._activePositionSource.suspend();
    this._emitter.emit('pause');
  }

  /**
   * Stop playback and reset to the beginning.
   *
   * The position source is deactivated and the 'stop' event is emitted
   * synchronously. The active timeline actions are then ended; the returned
   * promise resolves when their end operations have finished. Errors in end
   * operations are reported through the `error` event, not rethrown.
   */
  stop(): Promise<void> {
    if (!this._activePositionSource) {
      return Promise.resolve();
    }

    this._activePositionSource.deactivate();
    this._lastPosition = -1;
    this._pendingStarts.clear();
    this._emitter.emit('stop');

    const cleanup: Promise<void> = this._endActiveActionsReporting().finally(
      () => {
        if (this._pendingStopCleanup === cleanup) {
          this._pendingStopCleanup = undefined;
        }
      }
    );
    this._pendingStopCleanup = cleanup;
    return cleanup;
  }

  /**
   * Seek to a specific position
   * @param position - Target position in seconds
   * @returns Actual position after seek
   */
  async seek(position: number): Promise<number> {
    const source = this._activePositionSource;
    if (!source) {
      return 0;
    }

    const duration = source.getDuration();
    const currentPosition = source.getPosition();

    if (!Number.isFinite(position) || position < 0 || position > duration) {
      return currentPosition;
    }

    this._emitter.emit('seekStart', position, currentPosition, duration);
    // Starts still waiting for an earlier update are superseded by the
    // reconciliation below.
    this._pendingStarts.clear();

    await this._seekSource(source, position);
    // The seek target is reconciled below; the position update the source
    // emits for it (now, or when it resumes) must not dispatch actions again.
    this._lastPosition = position;
    await this._reconcileActions(this._currentTimelineUri, position);

    const finalPosition = source.getPosition();

    this._emitter.emit('seekComplete', finalPosition, duration);
    this._emitter.emit('time', finalPosition);

    return finalPosition;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TIMELINE MANAGEMENT - IEligiusEngine interface
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Switch to a different timeline.
   *
   * Ends the active actions of the current timeline, activates the new
   * timeline's position source (initialising it on first use), seeks it to
   * `position`, starts the actions that cover that position and starts
   * playback. The returned promise resolves when all of that is done.
   * Concurrent calls are processed one after the other.
   *
   * @param uri - Timeline URI to switch to
   * @param position - Optional starting position
   */
  switchTimeline(uri: string, position: number = 0): Promise<void> {
    const run = this._switchQueue.then(() =>
      this._switchTimeline(uri, position)
    );
    this._switchQueue = run.catch(noop);
    return run;
  }

  private async _switchTimeline(uri: string, position: number): Promise<void> {
    const previousSource = this._activePositionSource;
    if (!previousSource) {
      return;
    }

    const timelineConfig = this._timelineLookupCache.get(uri);
    if (!timelineConfig || this._currentTimelineUri === timelineConfig.uri) {
      return;
    }

    const providerInfo = this._getProviderInfo(timelineConfig);
    if (!providerInfo?.positionSource) {
      throw new Error(
        `No timeline provider configured for type ${timelineConfig.type}`
      );
    }

    const previousUri = this._currentTimelineUri;
    previousSource.deactivate();
    this._pendingStarts.clear();
    await this._cleanUpTimeline(previousUri);

    this._currentTimelineUri = timelineConfig.uri;
    this._emitter.emit('timelineChange', this._currentTimelineUri);

    await this._activateProvider(providerInfo);
    const source = providerInfo.positionSource;
    source.loop = timelineConfig.loop;

    // Select playlist item if playlist is available
    this._activePlaylist?.selectItem(uri);

    let target = source.getPosition();
    if (position > 0 && Number.isFinite(position) && isSeekable(source)) {
      const duration = source.getDuration();
      target =
        Number.isFinite(duration) && duration > 0
          ? Math.min(position, duration)
          : position;
      await this._seekSource(source, target);
    }

    // Start the actions covering the start position here, so the position
    // update that activation emits does not dispatch them a second time.
    this._lastPosition = target;
    await this._reconcileActions(timelineConfig.uri, target);

    await source.activate();
  }

  /**
   * Initializes the engine by creating the HTML layout and the first time line
   * by executing its initActions.
   */
  init(): Promise<IPositionSource> {
    this._createLayoutTemplate();

    this._removeEventbusListeners();
    this._addEventbusListeners();

    const {timelines} = this.configuration;

    this._currentTimelineUri = timelines?.[0]?.uri ?? '';

    this._createTimelineLookup();

    if (this.localesReady) {
      return this.localesReady.then(() => this._initializeTimelineProvider());
    }
    return this._initializeTimelineProvider();
  }

  private _createLayoutTemplate() {
    const {containerSelector} = this.configuration;
    const container = $(containerSelector);

    if (!container || !container.length) {
      throw new Error(`Container selector not found: ${containerSelector}`);
    }

    const {layoutTemplate} = this.configuration;

    if (layoutTemplate?.length) {
      container.html(layoutTemplate);
    } else {
      console.warn('layoutTemplate is empty, unable to create layout');
    }
  }

  private async _initializeTimelineProvider(): Promise<IPositionSource> {
    if (!this.configuration.timelines?.length) {
      throw new Error('No timelines present');
    }

    const firstTimeline = this.configuration.timelines[0];
    const providerSettings = this._getProviderInfo(firstTimeline);

    if (!providerSettings) {
      throw new Error(
        `No timeline provider configured for type ${firstTimeline.type}`
      );
    }

    if (!providerSettings.positionSource) {
      throw new Error('NO ACTIVE POSITION SOURCE');
    }

    this._lastPosition = -1;
    await this._activateProvider(providerSettings);
    providerSettings.positionSource.loop = firstTimeline.loop;

    await this._executeActions(this.configuration.initActions, 'start');
    this._emitter.emit('initialized');
    return providerSettings.positionSource;
  }

  private _getProviderInfo(
    timeline: IResolvedTimelineConfiguration
  ): ITimelineProviderInfo | undefined {
    return (
      this.timelineProvidersByUri?.[timeline.uri] ??
      this.timelineProviders?.[timeline.type]
    );
  }

  /**
   * Makes the given provider the active one, registering the engine callbacks
   * on its position source and initialising the source and container
   * provider the first time they are used.
   */
  private async _activateProvider(providerInfo: ITimelineProviderInfo) {
    this._activePositionSource = providerInfo.positionSource;
    this._activeContainerProvider = providerInfo.containerProvider;
    this._activePlaylist = providerInfo.playlist;

    await this._prepareSource(providerInfo.positionSource);
    await this._prepareContainer(
      providerInfo.containerProvider,
      providerInfo.positionSource
    );
  }

  private async _prepareSource(source: IPositionSource) {
    if (this._preparedSources.has(source)) {
      return;
    }
    this._preparedSources.add(source);

    // Sources stay registered after a switch, so every callback ignores
    // events from sources that are not the active one.
    source.onPosition(position => {
      if (source === this._activePositionSource) {
        this._onTimeHandler(position);
      }
    });
    source.onBoundaryReached(boundary => {
      if (source !== this._activePositionSource) {
        return;
      }
      if (boundary === 'end') {
        this._onCompleteCallback();
      } else if (boundary === 'start') {
        this._onRestartCallback();
      }
    });
    source.onActivated(() => {
      if (source === this._activePositionSource) {
        this._onFirstFrameCallback();
      }
    });

    await source.init();
  }

  private async _prepareContainer(
    containerProvider: IContainerProvider | undefined,
    source: IPositionSource
  ) {
    if (
      !containerProvider ||
      (containerProvider as unknown) === source ||
      this._preparedContainers.has(containerProvider)
    ) {
      return;
    }
    this._preparedContainers.add(containerProvider);
    await containerProvider.init?.();
  }

  private _onCompleteCallback() {
    // playState is now derived from position source state
    this._emitter.emit('timelineComplete');
  }

  private _onFirstFrameCallback() {
    this._emitter.emit('timelineFirstFrame');

    const duration = this._activePositionSource?.getDuration();
    if (duration !== undefined) {
      this._emitter.emit('duration', duration);
    }
  }

  private _onRestartCallback() {
    this._emitter.emit('timelineRestart');
  }

  /**
   * Cleans up all the necessary parts that the engine initialized.
   * - It stops the active position source.
   * - It ends the currently active timeline actions and the init actions.
   * - It detaches the controllers still attached to elements inside the
   *   engine root (those that no end operation removed).
   * - It removes all its eventbus listeners.
   * - It destroys all of its position sources and container providers.
   * - It empties the HTML element indicated by the containerSelector configuration property.
   *
   * Every step runs even when an earlier one fails. Errors are rethrown at
   * the end (an AggregateError when there is more than one).
   */
  async destroy() {
    const errors: unknown[] = [];
    const attempt = (step: () => void) => {
      try {
        step();
      } catch (error) {
        errors.push(error);
      }
    };

    // Stop the clock first, so no tick starts actions while others end.
    const activeSource = this._activePositionSource;
    attempt(() => activeSource?.deactivate());
    this._pendingStarts.clear();

    await this._endActionsSettled(
      this._getActiveActions(this._getTimelineActionsForCurrentTimeline()),
      errors
    );
    await this._endActionsSettled(
      [...(this.configuration.initActions ?? [])].reverse(),
      errors
    );

    // After the end operations, so a removeControllerFromElement in them
    // still finds its controller.
    attempt(() => {
      errors.push(
        ...detachControllersWithin(
          $(this.configuration.containerSelector),
          this.eventbus
        )
      );
    });

    attempt(() => this.localeManager.destroy());

    this._activePositionSource = undefined;
    this._activeContainerProvider = undefined;
    this._activePlaylist = undefined;
    attempt(() => this._removeEventbusListeners());

    const providers = this._allProviderInfos();
    const sources = new Set(providers.map(info => info.positionSource));
    sources.forEach(source => attempt(() => source?.destroy()));
    new Set(providers.map(info => info.containerProvider)).forEach(
      containerProvider => {
        if (
          containerProvider &&
          !sources.has(containerProvider as unknown as IPositionSource)
        ) {
          attempt(() => containerProvider.destroy?.());
        }
      }
    );
    this._preparedSources.clear();
    this._preparedContainers.clear();

    attempt(() => {
      const {containerSelector} = this.configuration;
      $(containerSelector).empty();
    });

    attempt(() => this._emitter.emit('destroyed'));
    this._emitter.removeAllListeners();
    this._errorSubscriptions.clear();

    if (errors.length === 1) {
      throw errors[0];
    }
    if (errors.length > 1) {
      throw new AggregateError(errors, 'Errors while destroying the engine');
    }
  }

  private _allProviderInfos(): ITimelineProviderInfo[] {
    return [
      ...Object.values(this.timelineProviders ?? {}),
      ...Object.values(this.timelineProvidersByUri ?? {}),
    ].filter(Boolean) as ITimelineProviderInfo[];
  }

  private async _endActionsSettled(
    actions: IEndableAction[],
    errors: unknown[]
  ) {
    for (const action of actions) {
      try {
        await action.end();
      } catch (error) {
        errors.push(error);
      }
    }
  }

  private _addEventListener(
    eventName: string,
    eventHandler: TEventHandler,
    eventTopic?: string
  ) {
    this._eventbusRemovers.push(
      this.eventbus.on(eventName as EventName, eventHandler, eventTopic)
    );
  }

  private _removeEventbusListeners() {
    const removers = this._eventbusRemovers;
    this._eventbusRemovers = [];
    removers.forEach(remover => remover());
  }

  /**
   * Registers the callback-style eventbus queries (`broadcast(name,
   * [resultCallback])`). Playback commands (`timeline-play-request` and so
   * on) and state broadcasts are owned by EngineEventbusAdapter.
   */
  private _addEventbusListeners() {
    this._addEventListener(
      'request-engine-root',
      this._handleRequestEngineRoot.bind(
        this,
        this.configuration.containerSelector
      )
    );
    this._addEventListener(
      'request-current-timeline-position',
      this._handleRequestTimelinePosition.bind(this)
    );
    this._addEventListener(
      'request-timeline-cleanup',
      this._handleTimelineComplete.bind(this)
    );
    this._addEventListener(
      'timeline-request-current-timeline',
      this._requestCurrentTimeline.bind(this)
    );
    this._addEventListener(
      'timeline-container-request',
      this._containerRequest.bind(this)
    );
    this._addEventListener(
      'timeline-duration-request',
      this._durationRequest.bind(this)
    );
  }

  private _durationRequest(callBack: TResultCallback<number | undefined>) {
    callBack(this.duration);
  }

  private _containerRequest(
    callBack: TResultCallback<JQuery<HTMLElement> | undefined>
  ) {
    callBack(this.container);
  }

  private _createTimelineLookup() {
    this._timelineSchedules = new Map();
    this._timelineLookupCache = new Map();

    if (!this.configuration.timelines) {
      return;
    }

    this.configuration.timelines.forEach(timelineInfo => {
      // Populate timeline lookup cache for O(1) access
      this._timelineLookupCache.set(timelineInfo.uri, timelineInfo);
      this._timelineSchedules.set(
        timelineInfo.uri,
        EligiusEngine._createSchedule(timelineInfo.timelineActions)
      );
    });
  }

  private static _createSchedule(
    timelineActions: ITimelineAction[]
  ): IScheduledActionEvent[] {
    const events: IScheduledActionEvent[] = [];

    timelineActions.forEach(action => {
      if (action.duration.end < 0) {
        action.duration.end = Infinity;
      }
      const {start, end} = action.duration;

      events.push({position: start, isStart: true, order: 1, action});
      if (Number.isFinite(end)) {
        events.push({
          position: end,
          isStart: false,
          order: end === start ? 2 : 0,
          action,
        });
      }
    });

    // Array.prototype.sort is stable, so starts at the same position keep
    // their configuration order.
    return events.sort((a, b) => {
      if (a.position !== b.position) {
        return a.position - b.position;
      }
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return a.isStart
        ? 0
        : sortActionsHighestStartPositionFirst(a.action, b.action);
    });
  }

  static sortTimelines(timelines: Record<number, ActionMethod[]>[]) {
    timelines.forEach(timelineActions => {
      Object.keys(timelineActions).forEach(key => {
        const numericKey = Number(key);
        timelineActions[numericKey] = EligiusEngine.sortActionsPerPosition(
          timelineActions[numericKey]
        );
      });
    });
  }

  static sortActionsPerPosition(actions: ActionMethod[]) {
    const [startMethods, endMethods] = actions.reduce(
      (acc, item) => {
        if (item.isStart) {
          acc[0].push(item);
        } else {
          acc[1].push(item);
        }
        return acc;
      },
      [[], []] as [ActionMethod[], ActionMethod[]]
    );
    return [
      ...endMethods.sort(sortActionMethodsHighestStartPositionFirst),
      ...startMethods,
    ];
  }

  private async _executeActions(
    actions: IEndableAction[],
    methodName: 'start' | 'end'
  ): Promise<void> {
    for (const action of actions) {
      await action[methodName]();
    }
  }

  private _handleRequestEngineRoot(
    engineRootSelector: string,
    resultCallback: TResultCallback<JQuery<HTMLElement>>
  ) {
    resultCallback($(engineRootSelector));
  }

  /**
   * Ends every active action of the given timeline (the current one by
   * default), highest start position first.
   */
  private _cleanUpTimeline(uri: string = this._currentTimelineUri) {
    return this._executeActions(
      this._getActiveActions(this._getTimelineActionsForUri(uri)),
      'end'
    );
  }

  private _getActiveActions(allActions: ITimelineAction[]) {
    const actions = allActions.filter(action => action.active);
    return actions.sort(sortActionsHighestStartPositionFirst);
  }

  private _handleRequestTimelinePosition(
    resultCallback: TResultCallback<number>
  ) {
    resultCallback(this._activePositionSource?.getPosition() ?? -1);
  }

  private _handleTimelineComplete() {
    this._pendingStarts.clear();
    this._endActiveActionsReporting();
  }

  /**
   * Ends every active action of the current timeline, highest start position
   * first, reporting failures through the `error` event. The returned promise
   * never rejects.
   */
  private async _endActiveActionsReporting(): Promise<void> {
    const actions = this._getActiveActions(
      this._getTimelineActionsForCurrentTimeline()
    );
    for (const action of actions) {
      await this._runActionMethod(action, 'end');
    }
  }

  /**
   * Calls the start or end of an action that the engine dispatches on its
   * own, routing a failure to the `error` event. The returned promise never
   * rejects.
   */
  private _runActionMethod(
    action: IEndableAction,
    phase: TActionPhase
  ): Promise<void> {
    try {
      return Promise.resolve(action[phase]()).then(noop, error =>
        this._reportActionError(action, phase, error)
      );
    } catch (error) {
      this._reportActionError(action, phase, error);
      return Promise.resolve();
    }
  }

  private _reportActionError(
    action: IEndableAction,
    phase: TActionPhase,
    cause: unknown
  ) {
    const error = new EngineActionError(action, phase, cause);
    if (this._errorSubscriptions.size > 0) {
      this._emitter.emit('error', error);
    } else {
      console.error(error.message);
    }
  }

  private _getTimelineActionsForCurrentTimeline() {
    return this._getTimelineActionsForUri(this._currentTimelineUri);
  }

  private _requestCurrentTimeline(resultCallback: TResultCallback<string>) {
    resultCallback(this._currentTimelineUri);
  }

  private _getTimelineActionsForUri(uri: string): ITimelineAction[] {
    const info = this._timelineLookupCache.get(uri);
    return info?.timelineActions ?? [];
  }

  /**
   * Seeks the source (when it is seekable) without dispatching the position
   * updates it emits while seeking; the caller reconciles the actions.
   */
  private async _seekSource(source: IPositionSource, position: number) {
    if (!isSeekable(source)) {
      return;
    }

    this._seekDepth++;
    try {
      await source.seek(position);
    } finally {
      this._seekDepth--;
    }
  }

  private _onTimeHandler(position: number) {
    if (Number.isNaN(position) || this._seekDepth > 0) {
      return;
    }
    if (this._lastPosition === position) {
      return;
    }

    const previousPosition = this._lastPosition;
    this._lastPosition = position;
    this._dispatchActionsBetween(previousPosition, position);
    this._emitter.emit('time', position);
  }

  /**
   * Dispatches the timeline actions whose start or end lies between the
   * previous and the current position.
   *
   * Moving forward, every start and end in `(from, to]` is processed in
   * position order, so skipped frames and coarse sources (video timeupdate,
   * scroll, keyboard steps) never miss an action. Moving backward, the
   * actions whose range no longer covers the position are ended and the ones
   * that cover it again are started, like a seek. Actions track their own
   * `active` state, so revisiting a key never runs a start or end twice.
   *
   * Within one update all ends run before any start: when the update ends
   * actions, its starts wait (as pending starts) until those ends have
   * settled. An action whose start and end both lie in the update (a skipped
   * or zero-length range) is ended right after it is started. Nothing is
   * awaited here; failures are reported through the `error` event.
   */
  private _dispatchActionsBetween(from: number, to: number) {
    const events = this._timelineSchedules.get(this._currentTimelineUri);
    if (!events?.length) {
      return;
    }

    const pending = this._pendingStarts;
    const ends: ITimelineAction[] = [];
    const starts: IPendingStart[] = [];
    const addStart = (action: ITimelineAction) => {
      const start: IPendingStart = {action, endAfterStart: false};
      pending.set(action, start);
      starts.push(start);
    };

    if (to > from) {
      const last = upperBound(events, to);
      for (let i = upperBound(events, from); i < last; i++) {
        const {action, isStart} = events[i];
        if (isStart) {
          if (!action.active && !pending.has(action)) {
            addStart(action);
          }
        } else if (action.active) {
          ends.push(action);
        } else {
          const start = pending.get(action);
          if (start) {
            start.endAfterStart = true;
          }
        }
      }
    } else {
      const toStart: ITimelineAction[] = [];
      const first = upperBound(events, to);
      for (let i = upperBound(events, from) - 1; i >= first; i--) {
        const {action, isStart} = events[i];
        if (isStart) {
          if (action.active) {
            ends.push(action);
          } else {
            // Back before its start: a start that is still waiting is dropped.
            pending.delete(action);
          }
        } else if (!action.active && action.duration.start <= to) {
          const start = pending.get(action);
          if (start) {
            start.endAfterStart = false;
          } else {
            toStart.push(action);
          }
        }
      }
      toStart
        .sort((a, b) => a.duration.start - b.duration.start)
        .forEach(addStart);
    }

    if (!ends.length) {
      this._runPendingStarts(starts);
      return;
    }

    const endsSettled = ends.map(action =>
      this._runActionMethod(action, 'end')
    );
    if (starts.length) {
      Promise.all(endsSettled).then(() => this._runPendingStarts(starts));
    }
  }

  /**
   * Runs the given pending starts that are still pending; seeking, stopping,
   * switching, cleanup, destroy or a later update may have cancelled them.
   */
  private _runPendingStarts(starts: IPendingStart[]) {
    for (const start of starts) {
      const {action} = start;
      if (this._pendingStarts.get(action) !== start) {
        continue;
      }
      this._pendingStarts.delete(action);
      this._runActionMethod(action, 'start');
      if (start.endAfterStart) {
        this._runActionMethod(action, 'end');
      }
    }
  }

  /**
   * Brings the actions of a timeline in line with a position: ends the active
   * actions that do not cover it and starts the inactive ones that do.
   */
  private async _reconcileActions(uri: string, position: number) {
    const timelineActions = this._getTimelineActionsForUri(uri);
    const actionsToEnd = this._getActiveActions(timelineActions).filter(
      action => !coversPosition(action, position)
    );
    const actionsToStart = timelineActions.filter(
      action => !action.active && coversPosition(action, position)
    );
    await this._executeActions(actionsToEnd, 'end');
    await this._executeActions(actionsToStart, 'start');
  }
}

const sortActionsHighestStartPositionFirst = (
  a: ITimelineAction,
  b: ITimelineAction
) => b.duration.start - a.duration.start;

const sortActionMethodsHighestStartPositionFirst = (
  a: ActionMethod,
  b: ActionMethod
) => {
  if (a.startPosition === undefined || b.startPosition === undefined) {
    return 0;
  }
  return b.startPosition - a.startPosition;
};
