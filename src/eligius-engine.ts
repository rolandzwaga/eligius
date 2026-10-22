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
import {findClosestNames, formatDidYouMean} from '@util/find-closest-names.ts';
import {TypedEventEmitter} from '@util/typed-event-emitter.ts';
import $ from 'jquery';
import type {ILocaleManager} from './locale/types.ts';
import type {
  EngineEvents,
  IEligiusEngine,
  IEligiusEngineOptions,
  IEngineActionError,
  IEngineEventSubscriptionOptions,
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
 * A start that a position update, seek or switch decided on but has not run
 * yet, because it waits for ends to finish.
 */
interface IPendingStart {
  action: ITimelineAction;
  /** A later update passed its end before the start could run */
  endAfterStart: boolean;
}

const noop = () => {};
const resolved: Promise<void> = Promise.resolve();

/**
 * A position source that asks the engine to switch to the previous or next
 * timeline, like KeyboardStepSource in `timeline-switch` mode.
 */
interface ITimelineChangeRequester {
  onTimelineChangeRequest(
    callback: (direction: 'prev' | 'next') => void
  ): (() => void) | void;
}

/**
 * `actionId` of the error the engine emits when a timeline switch that a
 * position source requested fails.
 */
const TIMELINE_CHANGE_REQUEST_ID = 'timeline-change-request';

interface ISignal {
  promise: Promise<void>;
  resolve: () => void;
}

function createSignal(): ISignal {
  let resolve: () => void = noop;
  const promise = new Promise<void>(settle => {
    resolve = settle;
  });
  return {promise, resolve};
}

/** The part of a seek that other commands wait for, see `seek()` */
interface ISeekStep {
  source: IPositionSource;
  duration: number;
  /** Settles when the seek's starts have begun */
  reconciled: Promise<void>;
}

/**
 * The end of an action's range. The configuration marks an open-ended range
 * with a negative end; it is read as Infinity without changing the action.
 */
function actionEnd(action: ITimelineAction): number {
  const {end} = action.duration;
  return end < 0 ? Infinity : end;
}

/**
 * Whether the action is in effect at the given position. Ranges are
 * half-open, `[start, end)`, so an action is ended exactly when the playhead
 * reaches its end, which matches what the position callback does.
 */
function coversPosition(action: ITimelineAction, position: number) {
  return action.duration.start <= position && position < actionEnd(action);
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

function invoke<T>(task: () => Promise<T>): Promise<T> {
  try {
    return task();
  } catch (error) {
    return Promise.reject(error);
  }
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
 *
 * Transport commands are serialised: `init()`, `start()`, `seek()`,
 * `switchTimeline()` and the action cleanup of `stop()` run one after the
 * other, in call order; a command called while another one runs waits for
 * it. A later `seek()`, `stop()` or `destroy()` supersedes a `seek()` that
 * has not finished. A later `pause()`, `stop()` or `destroy()` cancels a
 * `start()` that has not activated the timeline yet, and keeps a pending
 * `switchTimeline()` from starting playback. `pause()` and the synchronous
 * part of `stop()` take effect at once. After `destroy()`, pending commands
 * do nothing more and new ones are ignored; a pending `init()` rejects.
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
  /** The engine root, looked up once when the layout is created */
  private _engineRoot: JQuery<HTMLElement> | undefined = undefined;

  /** Position sources whose callbacks are registered */
  private _wiredSources: Set<IPositionSource> = new Set();
  /** Removes registrations on sources that destroy() must undo */
  private _sourceRemovers: Array<() => void> = [];
  /** Position sources whose init() succeeded */
  private _preparedSources: Set<IPositionSource> = new Set();
  /** Container providers whose init() succeeded */
  private _preparedContainers: Set<IContainerProvider> = new Set();
  /**
   * Sources and container providers whose init() has not settled yet.
   * destroy() leaves them alone; they are destroyed when init() settles.
   */
  private _initializing: Set<object> = new Set();
  /** Init actions whose start resolved, in start order */
  private _startedInitActions: Set<IEndableAction> = new Set();

  private _lastPosition: number = -1;
  /**
   * Set just before a source is activated. The first position it reports is
   * then reconciled like a seek instead of dispatched as an interval from the
   * previous position: a scroll container scrolled while its timeline was not
   * playing would otherwise start and end every action between the previous
   * position and its offset.
   */
  private _reconcileNextPosition = false;
  /** Position updates are ignored while a seek is in progress */
  private _seekDepth = 0;
  /** Settles when the last scheduled transport command has settled */
  private _transportTail: Promise<void> = resolved;
  /** Transport commands scheduled and not settled yet */
  private _transportPending = 0;
  /**
   * Incremented by seek(), stop() and destroy() (see `_bumpPositionToken`).
   * A seek that sees another value after an await has been superseded.
   */
  private _positionToken = 0;
  /** Resolved and replaced whenever `_positionToken` changes */
  private _positionTokenChanged: ISignal = createSignal();
  /**
   * Incremented by start(), pause(), stop() and destroy(). A pending start()
   * or switchTimeline() only starts playback while it is unchanged.
   */
  private _playToken = 0;
  private _initCalled = false;
  private _destroyed = false;
  private _destroyPromise: Promise<void> | undefined = undefined;
  /**
   * Starts waiting for ends to settle. Seeking, stopping, switching, cleanup
   * and destroy clear it, which cancels them.
   */
  private _pendingStarts: Map<ITimelineAction, IPendingStart> = new Map();
  /**
   * Settles when the last batch of starts that waited for ends has run.
   * Later batches wait for it, so starts run in timeline order. Undefined
   * when no batch is waiting.
   */
  private _startGate: Promise<void> | undefined = undefined;
  /** Live `error` subscriptions, to log errors nobody listens to */
  private _errorSubscriptions: Set<object> = new Set();
  private _emitter = new TypedEventEmitter<EngineEvents>();
  /** See {@link IEligiusEngineOptions.maxCatchUp} */
  private readonly _maxCatchUp: number;

  // ─────────────────────────────────────────────────────────────────────────
  // STATE (synchronous reads) - IEligiusEngine interface
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Current timeline position in seconds (supports fractional values); 0
   * when no timeline is active (before init() and after destroy())
   */
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

  /**
   * Root element of the engine (container selector). From init() until
   * destroy() the same jQuery instance is returned.
   */
  get engineRoot(): JQuery<HTMLElement> {
    return this._engineRoot ?? $(this.configuration.containerSelector);
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
   * @param options - Optional engine options
   * @throws Error when an option is invalid
   */
  constructor(
    private configuration: IResolvedEngineConfiguration,
    private eventbus: IEventbus,
    private timelineProviders: Record<TimelineTypes, ITimelineProviderInfo>,
    private localeManager: ILocaleManager,
    private timelineProvidersByUri?: Record<string, ITimelineProviderInfo>,
    private localesReady?: Promise<void>,
    options?: IEligiusEngineOptions
  ) {
    const maxCatchUp = options?.maxCatchUp ?? Infinity;
    if (typeof maxCatchUp !== 'number' || !(maxCatchUp > 0)) {
      throw new Error(
        `EligiusEngine: options.maxCatchUp must be a positive number of seconds, got ${String(maxCatchUp)}`
      );
    }
    this._maxCatchUp = maxCatchUp;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EVENTS - IEligiusEngine interface
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Subscribe to engine events.
   *
   * Errors of timeline actions that the engine starts or ends on its own are
   * reported through the `error` event; while it has no subscribers they are
   * logged with `console.error` instead. A subscription made with
   * `{forwardOnly: true}` (EngineEventbusAdapter makes one to broadcast
   * `engine-error`) does not count as a subscriber.
   *
   * @param event - Event name
   * @param handler - Event handler
   * @param options - Optional subscription options
   * @returns Unsubscribe function
   */
  on<K extends keyof EngineEvents>(
    event: K,
    handler: (...args: EngineEvents[K]) => void,
    options?: IEngineEventSubscriptionOptions
  ): () => void {
    const unsubscribe = this._emitter.on(event, handler);
    if (event !== 'error' || options?.forwardOnly) {
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
   * Start playback.
   *
   * Waits for transport commands called earlier (for example the action
   * cleanup of `stop()`). Emits `start` once the timeline plays; not when it
   * already did, or when `pause()`, `stop()` or `destroy()` came first.
   *
   * @throws If autoplay is blocked (video provider)
   */
  start(): Promise<void> {
    if (this._destroyed) {
      return resolved;
    }
    const token = ++this._playToken;
    return this._schedule(() => this._start(token));
  }

  private async _start(token: number): Promise<void> {
    const source = this._activePositionSource;
    if (
      !source ||
      this._destroyed ||
      token !== this._playToken ||
      source.state === 'active'
    ) {
      return;
    }

    this._reconcileNextPosition = true;
    await source.activate();
    // activate() also resolves when pause/stop/destroy superseded it
    if (
      !this._destroyed &&
      source === this._activePositionSource &&
      this.playState === 'playing'
    ) {
      this._emitter.emit('start');
    }
  }

  /**
   * Pause playback. Emits `pause` when the timeline was playing. A `start()`
   * that has not activated the timeline yet is cancelled.
   */
  pause(): void {
    const source = this._activePositionSource;
    if (!source || this._destroyed) {
      return;
    }

    this._playToken++;
    if (source.state !== 'active') {
      return;
    }
    source.suspend();
    this._emitter.emit('pause');
  }

  /**
   * Stop playback and reset to the beginning.
   *
   * The position source is deactivated and the 'stop' event is emitted
   * synchronously; a pending `start()` or `seek()` is cancelled. The active
   * timeline actions are then ended, after transport commands called
   * earlier; the returned promise resolves when their end operations have
   * finished, or earlier when a later `seek()` or `stop()` takes over.
   * A `start()` called after `stop()` waits for it. Errors in end
   * operations are reported through the `error` event, not rethrown.
   */
  stop(): Promise<void> {
    const source = this._activePositionSource;
    if (!source || this._destroyed) {
      return resolved;
    }

    this._playToken++;
    const token = this._bumpPositionToken();
    source.deactivate();
    this._lastPosition = -1;
    this._cancelPendingStarts();
    this._emitter.emit('stop');

    return this._schedule(() =>
      this._waitUnlessSuperseded(this._endActiveActionsReporting(), token)
    );
  }

  /**
   * Seek to a specific position.
   *
   * Ends the active actions that do not cover the position and, once those
   * ends have finished, starts the ones that do. The returned promise
   * resolves when the starts have begun; it does not wait for start
   * operations to finish. Failing actions are reported through the `error`
   * event. Other commands only wait for the source to seek, not for the
   * end operations. A later `seek()` or `stop()` supersedes this one: it
   * then resolves with the position at that moment without emitting
   * `seekComplete`, and its starts that had not run yet are dropped. When a
   * `switchTimeline()` replaces the timeline before the seek's starts have
   * begun, it resolves with the new timeline's position, also without
   * emitting `seekComplete`.
   *
   * @param position - Target position in seconds
   * @returns Actual position after seek
   */
  seek(position: number): Promise<number> {
    if (this._destroyed || !Number.isFinite(position) || position < 0) {
      return Promise.resolve(this.position);
    }
    const source = this._activePositionSource;
    if (source && position > source.getDuration()) {
      return Promise.resolve(source.getPosition());
    }

    const token = this._bumpPositionToken();
    // Starts still waiting (including those of a seek this one supersedes)
    // are replaced by this seek's reconciliation.
    this._cancelPendingStarts();
    return this._schedule(() =>
      this._seekSourceAndReconcile(position, token)
    ).then(async step => {
      if (!step) {
        return this.position;
      }
      await this._waitUnlessSuperseded(step.reconciled, token);
      if (!this._destroyed && step.source !== this._activePositionSource) {
        // A switchTimeline() took over: the seeked timeline is gone.
        return this.position;
      }
      const finalPosition = step.source.getPosition();
      if (!this._isSuperseded(token)) {
        this._emitter.emit('seekComplete', finalPosition, step.duration);
        this._emitter.emit('time', finalPosition);
      }
      return finalPosition;
    });
  }

  /**
   * The part of a seek that other transport commands wait for: seeking the
   * source and deciding which actions to end and start. Resolves with the
   * reconciliation still running, or undefined when the seek did not happen.
   */
  private async _seekSourceAndReconcile(
    position: number,
    token: number
  ): Promise<ISeekStep | undefined> {
    const source = this._activePositionSource;
    if (!source || this._isSuperseded(token)) {
      return undefined;
    }
    const currentPosition = source.getPosition();
    const duration = source.getDuration();
    if (position > duration) {
      return undefined;
    }

    this._emitter.emit('seekStart', position, currentPosition, duration);
    this._cancelPendingStarts();

    await this._seekSource(source, position);
    if (this._isSuperseded(token)) {
      return undefined;
    }
    // The seek target is reconciled below; the position update the source
    // emits for it (now, or when it resumes) must not dispatch actions again.
    this._lastPosition = position;
    const reconciled = this._reconcileActions(
      this._currentTimelineUri,
      position
    );
    return {source, duration, reconciled};
  }

  private _isSuperseded(positionToken: number) {
    return this._destroyed || positionToken !== this._positionToken;
  }

  /**
   * Increments the position token, which supersedes running seeks and
   * releases the waits of `_waitUnlessSuperseded`.
   *
   * @returns The new token
   */
  private _bumpPositionToken(): number {
    this._positionToken++;
    const changed = this._positionTokenChanged;
    this._positionTokenChanged = createSignal();
    changed.resolve();
    return this._positionToken;
  }

  /**
   * Waits for `work`, unless the position token changes first (a later
   * seek, stop or destroy), so a slow or hung end operation cannot hold up
   * the commands that follow.
   */
  private _waitUnlessSuperseded(
    work: Promise<void>,
    token: number
  ): Promise<void> {
    if (this._isSuperseded(token)) {
      return resolved;
    }
    return Promise.race([work, this._positionTokenChanged.promise]);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TIMELINE MANAGEMENT - IEligiusEngine interface
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Switch to a different timeline.
   *
   * First initialises the new timeline's position source and container
   * provider on first use. If that fails, the current timeline is left as it
   * was and the promise rejects, so a later call retries. Then it ends the
   * active actions of the current timeline, activates the new timeline,
   * seeks it to `position`, emits `timelineChange`, starts the actions that
   * cover that position and starts playback (unless `pause()` or `stop()`
   * was called after this call). The returned promise resolves when
   * playback has started; it does not wait for start operations to finish.
   * Failing actions are reported through the `error` event. Concurrent
   * calls are processed one after the other. Switching to the current
   * timeline does nothing.
   *
   * @param uri - Timeline URI to switch to
   * @param position - Optional starting position
   * @throws Error (rejects) when the engine is not initialised or no timeline
   * has the URI
   */
  switchTimeline(uri: string, position: number = 0): Promise<void> {
    if (this._destroyed) {
      return resolved;
    }
    if (!this._initCalled) {
      return Promise.reject(
        new Error(
          `EligiusEngine.switchTimeline('${uri}'): the engine is not initialised, call init() first`
        )
      );
    }
    const timelineConfig = this._timelineLookupCache.get(uri);
    if (!timelineConfig) {
      return Promise.reject(this._unknownTimelineError(uri));
    }

    const playToken = this._playToken;
    return this._schedule(() =>
      this._switchTimeline(timelineConfig, position, playToken)
    );
  }

  private _unknownTimelineError(uri: string) {
    const known = [...this._timelineLookupCache.keys()];
    const suggestion = formatDidYouMean(findClosestNames(uri, known));
    return new Error(
      `EligiusEngine.switchTimeline('${uri}'): unknown timeline URI. ${
        suggestion ? `${suggestion} ` : ''
      }Known timelines: ${known.map(name => `'${name}'`).join(', ')}`
    );
  }

  private async _switchTimeline(
    timelineConfig: IResolvedTimelineConfiguration,
    position: number,
    playToken: number
  ): Promise<void> {
    const previousSource = this._activePositionSource;
    if (
      this._destroyed ||
      !previousSource ||
      this._currentTimelineUri === timelineConfig.uri
    ) {
      return;
    }

    const providerInfo = this._getProviderInfo(timelineConfig);
    if (!providerInfo?.positionSource) {
      throw new Error(
        `EligiusEngine.switchTimeline('${timelineConfig.uri}'): no timeline provider configured for type '${timelineConfig.type}'`
      );
    }
    const source = providerInfo.positionSource;
    const {playlist} = providerInfo;
    if (playlist?.hasItem && !playlist.hasItem(timelineConfig.uri)) {
      throw new Error(
        `EligiusEngine.switchTimeline('${timelineConfig.uri}'): the timeline's playlist has no item '${timelineConfig.uri}'`
      );
    }

    // Initialise first: when that fails (a video that does not load) the
    // current timeline keeps running and a later switch retries.
    await this._prepareProvider(providerInfo);
    if (this._destroyed) {
      return;
    }

    const previousUri = this._currentTimelineUri;
    previousSource.deactivate();
    this._lastPosition = -1;
    this._cancelPendingStarts();
    await this._waitUnlessSuperseded(
      this._endActiveActionsReporting(previousUri),
      this._positionToken
    );
    if (this._destroyed) {
      return;
    }

    this._activePositionSource = source;
    this._activeContainerProvider = providerInfo.containerProvider;
    this._activePlaylist = providerInfo.playlist;
    this._currentTimelineUri = timelineConfig.uri;
    source.loop = timelineConfig.loop;
    this._activePlaylist?.selectItem(timelineConfig.uri);

    let target = source.getPosition();
    if (position > 0 && Number.isFinite(position) && isSeekable(source)) {
      const duration = source.getDuration();
      target =
        Number.isFinite(duration) && duration > 0
          ? Math.min(position, duration)
          : position;
      await this._seekSource(source, target);
      if (this._destroyed) {
        return;
      }
    }

    // The new timeline is active now, so listeners that query the engine get
    // its source, container, duration and position.
    this._emitter.emit('timelineChange', timelineConfig.uri);

    // Start the actions covering the start position here, so the position
    // update that activation emits does not dispatch them a second time.
    this._lastPosition = target;
    await this._reconcileActions(timelineConfig.uri, target);

    if (this._destroyed || playToken !== this._playToken) {
      return;
    }
    this._reconcileNextPosition = true;
    await source.activate();
  }

  /**
   * Initializes the engine by creating the HTML layout and the first time line
   * by executing its initActions.
   *
   * @returns The position source of the first timeline
   * @throws Error when the container selector matches nothing (synchronously)
   * @throws Error (rejects) when there are no timelines or no provider for the
   * first timeline, when its source fails to initialise, an init action
   * fails or external locales fail to load, and when the engine is destroyed
   * before init completes
   */
  init(): Promise<IPositionSource> {
    if (this._destroyed) {
      return Promise.reject(
        new Error('EligiusEngine.init(): the engine has been destroyed')
      );
    }

    this._createLayoutTemplate();

    this._removeEventbusListeners();
    this._addEventbusListeners();

    const {timelines} = this.configuration;

    this._currentTimelineUri = timelines?.[0]?.uri ?? '';

    this._createTimelineLookup();
    this._initCalled = true;

    return this._schedule(() => this._initialize());
  }

  private async _initialize(): Promise<IPositionSource> {
    if (this.localesReady) {
      await this.localesReady;
      this._throwIfDestroyed('init()');
    }
    return this._initializeTimelineProvider();
  }

  private _throwIfDestroyed(method: string) {
    if (this._destroyed) {
      throw new Error(
        `EligiusEngine.${method}: the engine was destroyed before it completed`
      );
    }
  }

  private _createLayoutTemplate() {
    const {containerSelector} = this.configuration;
    const container = $(containerSelector);

    if (!container || !container.length) {
      throw new Error(`Container selector not found: ${containerSelector}`);
    }
    this._engineRoot = container;

    const {layoutTemplate} = this.configuration;

    if (layoutTemplate?.length) {
      // html() drops the jQuery data of the replaced elements, so controllers
      // still attached to them would stay subscribed to the eventbus.
      const errors = detachControllersWithin(
        container.children(),
        this.eventbus
      );
      errors.forEach(error => {
        console.error(
          'EligiusEngine.init(): detaching a controller from the replaced layout failed',
          error
        );
      });
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
    await this._prepareProvider(providerSettings);
    this._throwIfDestroyed('init()');
    this._activePositionSource = providerSettings.positionSource;
    this._activeContainerProvider = providerSettings.containerProvider;
    this._activePlaylist = providerSettings.playlist;
    providerSettings.positionSource.loop = firstTimeline.loop;

    for (const action of this.configuration.initActions ?? []) {
      await action.start();
      if (this._destroyed) {
        // destroy() only ended the init actions that had started before
        await this._runActionMethod(action, 'end');
        this._throwIfDestroyed('init()');
      }
      this._startedInitActions.add(action);
    }
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
   * Initialises the provider's position source and container provider the
   * first time they are used, registering the engine callbacks on the
   * source. A failed init is not remembered, so the next use retries it.
   */
  private async _prepareProvider(providerInfo: ITimelineProviderInfo) {
    await this._prepareSource(providerInfo.positionSource);
    if (this._destroyed) {
      return;
    }
    await this._prepareContainer(
      providerInfo.containerProvider,
      providerInfo.positionSource
    );
  }

  private async _prepareSource(source: IPositionSource) {
    if (this._preparedSources.has(source)) {
      return;
    }
    this._wireSource(source);
    await this._initializeComponent(source, () => source.init());
    if (!this._destroyed) {
      this._preparedSources.add(source);
    }
  }

  /**
   * Registers the engine callbacks on a source, once per source.
   */
  private _wireSource(source: IPositionSource) {
    if (this._wiredSources.has(source)) {
      return;
    }
    this._wiredSources.add(source);

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
    this._wireTimelineChangeRequests(source);
  }

  /**
   * Sources that ask for timeline changes (KeyboardStepSource in
   * `timeline-switch` mode) switch to the previous or next configured
   * timeline, from its start. Requests at the first or the last timeline do
   * nothing. A failed switch is reported through the `error` event.
   */
  private _wireTimelineChangeRequests(source: IPositionSource) {
    const requester = source as Partial<ITimelineChangeRequester>;
    if (
      typeof requester.onTimelineChangeRequest !== 'function' ||
      (this.configuration.timelines?.length ?? 0) < 2
    ) {
      // With a single timeline Up/Down keep their default behaviour.
      return;
    }
    const remover = requester.onTimelineChangeRequest(direction => {
      if (this._destroyed || source !== this._activePositionSource) {
        return;
      }
      const uris = (this.configuration.timelines ?? []).map(
        timeline => timeline.uri
      );
      const index = uris.indexOf(this._currentTimelineUri);
      const target = index + (direction === 'next' ? 1 : -1);
      if (index === -1 || target < 0 || target >= uris.length) {
        return;
      }
      const uri = uris[target];
      this.switchTimeline(uri, 0).catch(error => {
        this._reportActionError(
          {id: TIMELINE_CHANGE_REQUEST_ID, name: `switchTimeline('${uri}')`},
          'start',
          error
        );
      });
    });
    if (typeof remover === 'function') {
      this._sourceRemovers.push(remover);
    }
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
    await this._initializeComponent(containerProvider, async () => {
      await containerProvider.init?.();
    });
    if (!this._destroyed) {
      this._preparedContainers.add(containerProvider);
    }
  }

  /**
   * Runs a component's init(). When the engine was destroyed meanwhile,
   * destroy() skipped the component, so it is destroyed here.
   */
  private async _initializeComponent(
    component: {destroy?(): void},
    init: () => Promise<void>
  ) {
    this._initializing.add(component);
    try {
      await init();
    } finally {
      this._initializing.delete(component);
      if (this._destroyed) {
        try {
          component.destroy?.();
        } catch (error) {
          console.error(
            'EligiusEngine: destroying a component that finished initialising after destroy() failed',
            error
          );
        }
      }
    }
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
   * - It stops the active position source and cancels pending commands.
   * - It ends the currently active timeline actions and the init actions
   *   that started.
   * - It detaches the controllers still attached to elements inside the
   *   engine root (those that no end operation removed).
   * - It removes all its eventbus listeners.
   * - It destroys all of its position sources and container providers.
   * - It empties the HTML element indicated by the containerSelector configuration property.
   *
   * Every step runs even when an earlier one fails. Errors are rethrown at
   * the end (an AggregateError when there is more than one). Calling it
   * again returns the same promise; the teardown runs once.
   */
  destroy(): Promise<void> {
    this._destroyPromise ??= this._destroy();
    return this._destroyPromise;
  }

  private async _destroy() {
    // Pending commands check this after every await and do nothing more.
    this._destroyed = true;
    this._playToken++;
    this._bumpPositionToken();

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
    this._cancelPendingStarts();

    await this._endActionsSettled(
      this._getActiveActions(this._getTimelineActionsForCurrentTimeline()),
      errors
    );
    const initActions = [...this._startedInitActions].reverse();
    this._startedInitActions.clear();
    await this._endActionsSettled(initActions, errors);

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

    const sourceRemovers = this._sourceRemovers.splice(0);
    sourceRemovers.forEach(remove => {
      attempt(remove);
    });

    this._activePositionSource = undefined;
    this._activeContainerProvider = undefined;
    this._activePlaylist = undefined;
    attempt(() => this._removeEventbusListeners());

    // Components still initialising are destroyed when their init settles.
    const providers = this._allProviderInfos();
    const sources = new Set(providers.map(info => info.positionSource));
    sources.forEach(source => {
      if (source && !this._initializing.has(source)) {
        attempt(() => source.destroy());
      }
    });
    new Set(providers.map(info => info.containerProvider)).forEach(
      containerProvider => {
        if (
          containerProvider &&
          !sources.has(containerProvider as unknown as IPositionSource) &&
          !this._initializing.has(containerProvider)
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
    this._engineRoot = undefined;

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

  /**
   * Runs `task` once the transport commands scheduled before it have
   * settled. When none is pending it runs right away, synchronously up to
   * its first await, so `start()` on an idle engine activates the source
   * before it returns.
   */
  private _schedule<T>(task: () => Promise<T>): Promise<T> {
    const previous = this._transportTail;
    const idle = this._transportPending === 0;
    let release: () => void = noop;
    this._transportTail = new Promise<void>(resolve => {
      release = resolve;
    });
    this._transportPending++;

    const run = idle ? invoke(task) : previous.then(task);
    const done = () => {
      this._transportPending--;
      release();
    };
    run.then(done, done);
    return run;
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
      this._handleRequestEngineRoot.bind(this)
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

  /**
   * Builds the sorted start and end events of a timeline. The actions are
   * only read; an open-ended range (negative end) gets no end event.
   */
  private static _createSchedule(
    timelineActions: ITimelineAction[]
  ): IScheduledActionEvent[] {
    const events: IScheduledActionEvent[] = [];

    timelineActions.forEach(action => {
      const {start} = action.duration;
      const end = actionEnd(action);

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

  /**
   * @deprecated Left over from the removed per-position dispatch; the engine
   * does not use it. Will be removed in the next major version.
   */
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

  /**
   * @deprecated Left over from the removed per-position dispatch; the engine
   * does not use it. Will be removed in the next major version.
   */
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

  private _handleRequestEngineRoot(
    resultCallback: TResultCallback<JQuery<HTMLElement>>
  ) {
    resultCallback(this.engineRoot);
  }

  private _getActiveActions(allActions: ITimelineAction[]) {
    const actions = allActions.filter(action => action.active);
    return actions.sort(sortActionsHighestStartPositionFirst);
  }

  /**
   * Answers with {@link position}, like the `request()` responder of
   * EngineEventbusAdapter does: 0 when no timeline is active.
   */
  private _handleRequestTimelinePosition(
    resultCallback: TResultCallback<number>
  ) {
    resultCallback(this.position);
  }

  private _handleTimelineComplete() {
    this._cancelPendingStarts();
    this._endActiveActionsReporting();
  }

  /**
   * Ends every active action of the given timeline (the current one by
   * default), highest start position first, reporting failures through the
   * `error` event. The returned promise never rejects.
   */
  private async _endActiveActionsReporting(
    uri: string = this._currentTimelineUri
  ): Promise<void> {
    const actions = this._getActiveActions(this._getTimelineActionsForUri(uri));
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
      return resolved;
    }
  }

  /**
   * Emits the failure through the `error` event; while nothing but
   * forward-only subscriptions listen, it is also logged with its cause, so
   * the original stack is kept.
   */
  private _reportActionError(
    action: Pick<IAction, 'id' | 'name'>,
    phase: TActionPhase,
    cause: unknown
  ) {
    const error = new EngineActionError(action, phase, cause);
    this._emitter.emit('error', error);
    if (this._errorSubscriptions.size === 0) {
      console.error(error.message, cause);
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
    if (this._reconcileNextPosition) {
      this._reconcileNextPosition = false;
      if (this._lastPosition !== position) {
        this._lastPosition = position;
        this._reconcileActions(this._currentTimelineUri, position);
        this._emitter.emit('time', position);
      }
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
   * scroll, keyboard steps) never miss an action. A forward jump larger than
   * `maxCatchUp` is reconciled like a seek instead. Moving backward, the
   * actions whose range no longer covers the position are ended and the ones
   * that cover it again are started, like a seek. Actions track their own
   * `active` state, so revisiting a key never runs a start or end twice.
   *
   * All ends run before any start: when the update ends actions, or starts
   * of an earlier update are still waiting, its starts wait (as pending
   * starts) until those have run. An action whose start and end both lie in
   * the update (a skipped or zero-length range) is ended right after it is
   * started; TimelineAction runs its end operations once its start
   * operations have finished. Nothing is awaited here, and nothing is
   * allocated when the update crosses no start or end. Failures are reported
   * through the `error` event.
   */
  private _dispatchActionsBetween(from: number, to: number) {
    const events = this._timelineSchedules.get(this._currentTimelineUri);
    if (!events?.length) {
      return;
    }

    const forward = to > from;
    const low = upperBound(events, forward ? from : to);
    const high = upperBound(events, forward ? to : from);
    if (low === high) {
      return;
    }

    if (forward && to - from > this._maxCatchUp) {
      this._reconcileActions(this._currentTimelineUri, to);
      return;
    }

    const pending = this._pendingStarts;
    const ends: ITimelineAction[] = [];
    const starts: IPendingStart[] = [];

    if (forward) {
      for (let i = low; i < high; i++) {
        const {action, isStart} = events[i];
        if (isStart) {
          if (!action.active && !pending.has(action)) {
            this._addPendingStart(action, starts);
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
      for (let i = high - 1; i >= low; i--) {
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
        .forEach(action => this._addPendingStart(action, starts));
    }

    this._runEndsThenStarts(ends, starts);
  }

  private _addPendingStart(action: ITimelineAction, starts: IPendingStart[]) {
    const start: IPendingStart = {action, endAfterStart: false};
    this._pendingStarts.set(action, start);
    starts.push(start);
  }

  /**
   * Ends the given actions, and runs the given pending starts once those
   * ends and every earlier batch of waiting starts have settled; right away
   * when there is nothing to wait for. The returned promise settles when the
   * starts have been run (not when their operations finish) and never
   * rejects.
   */
  private _runEndsThenStarts(
    ends: ITimelineAction[],
    starts: IPendingStart[]
  ): Promise<void> {
    const waitFor: Promise<void>[] = [];
    for (const action of ends) {
      waitFor.push(this._runActionMethod(action, 'end'));
    }
    if (starts.length && this._startGate) {
      waitFor.push(this._startGate);
    }
    if (!waitFor.length) {
      this._runPendingStarts(starts);
      return resolved;
    }

    const settled = Promise.all(waitFor).then(noop);
    if (!starts.length) {
      return settled;
    }
    const gate: Promise<void> = settled.then(() => {
      if (this._startGate === gate) {
        this._startGate = undefined;
      }
      this._runPendingStarts(starts);
    });
    this._startGate = gate;
    return gate;
  }

  /**
   * Cancels the starts that are waiting for ends, and the ordering of later
   * starts behind them.
   */
  private _cancelPendingStarts() {
    this._pendingStarts.clear();
    this._startGate = undefined;
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
   * actions that do not cover it and, once those ends have finished, starts
   * the inactive ones that do. The `active` flags change synchronously, so
   * position updates that arrive meanwhile see the reconciled state. The
   * returned promise settles once the starts have begun and never rejects;
   * failures are reported through the `error` event.
   */
  private _reconcileActions(uri: string, position: number): Promise<void> {
    const timelineActions = this._getTimelineActionsForUri(uri);
    const ends = this._getActiveActions(timelineActions).filter(
      action => !coversPosition(action, position)
    );
    const starts: IPendingStart[] = [];
    for (const action of timelineActions) {
      const pending = this._pendingStarts.get(action);
      if (pending) {
        pending.endAfterStart = !coversPosition(action, position);
      } else if (!action.active && coversPosition(action, position)) {
        this._addPendingStart(action, starts);
      }
    }
    return this._runEndsThenStarts(ends, starts);
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
