import $ from 'jquery';
import type {IEndableAction, ITimelineAction} from './action/types.ts';
import type {
  IResolvedEngineConfiguration,
  IResolvedTimelineConfiguration,
} from './configuration/types.ts';
import type {
  IEventbus,
  TEventbusRemover,
  TEventHandler,
} from './eventbus/types.ts';
import type {LanguageManager} from './language-manager.ts';
import {TimelineEventNames} from './timeline-event-names.ts';
import type {ITimelineProvider} from './timelineproviders/types.ts';
import type {
  IEligiusEngine,
  ITimelineProviderInfo,
  TimelineTypes,
  TResultCallback,
} from './types.ts';

type ActionMethod =
  | (IEndableAction['start'] & ActionMethodMetadata)
  | (IEndableAction['end'] & ActionMethodMetadata);

interface ActionMethodMetadata {
  id: string;
  isStart: boolean;
  startPosition?: number;
}

/**
 * This is where the magic happens. The engine is responsible for starting and stopping
 * the given timeline provider and triggering the actions associated with the positions along the timeline.
 */
export class EligiusEngine implements IEligiusEngine {
  private _timeLineActionsLookup: Record<
    string,
    Record<number, ActionMethod[]>
  > = {};
  private _timelineLookupCache: Map<string, IResolvedTimelineConfiguration> =
    new Map();
  private _eventbusRemovers: TEventbusRemover[] = [];
  private _currentTimelineUri: string = '';
  private _activeTimelineProvider: ITimelineProvider | undefined = undefined;
  private _lastPosition: number = -1;

  constructor(
    private configuration: IResolvedEngineConfiguration,
    private eventbus: IEventbus,
    private timelineProviders: Record<TimelineTypes, ITimelineProviderInfo>,
    private languageManager: LanguageManager
  ) {}

  /**
   * Initializes the engine by creating the HTML layout and the first time line
   * by executing its initActions.
   */
  init(): Promise<ITimelineProvider> {
    this._createLayoutTemplate();

    this._addEventbusListeners();

    const {timelines} = this.configuration;

    this._currentTimelineUri = timelines?.[0].uri ?? '';

    this._createTimelineLookup();

    return this._initializeTimelineProvider();
  }

  private _createLayoutTemplate() {
    const {containerSelector} = this.configuration;
    const container = $(containerSelector);

    if (!container || !container.length) {
      throw new Error(`Container selector not found: ${containerSelector}`);
    }

    const {layoutTemplate} = this.configuration;

    if (layoutTemplate && layoutTemplate.length) {
      container.html(layoutTemplate);
    } else {
      console.warn('layoutTemplate is empty, unable to create layout');
    }
  }

  private async _initializeTimelineProvider() {
    if (!this.configuration.timelines?.length) {
      throw new Error('No timelines present');
    }

    const firstTimeline = this.configuration.timelines[0];
    const providerSettings = this.timelineProviders[firstTimeline.type];

    if (!providerSettings) {
      throw new Error(
        `No timeline provider configured for type ${firstTimeline.type}`
      );
    }

    this._activeTimelineProvider?.destroy();
    this._activeTimelineProvider = providerSettings.provider;

    if (!this._activeTimelineProvider) {
      throw new Error('NO ACTIVE TIMELINE PROVIDER');
    }

    this._activeTimelineProvider.onTime(
      this._onTimeHandler.bind(this, Math.floor)
    );
    this._activeTimelineProvider.onComplete(
      this._onCompleteCallback.bind(this)
    );
    this._activeTimelineProvider.onFirstFrame(
      this._onFirstFrameCallback.bind(this)
    );
    this._activeTimelineProvider.onRestart(this._onRestartCallback.bind(this));

    await this._activeTimelineProvider.init();
    await this._executeActions(this.configuration.initActions, 'start');
    return this._activeTimelineProvider;
  }

  private _onCompleteCallback() {
    this.eventbus.broadcast(TimelineEventNames.COMPLETE);
  }

  private _onFirstFrameCallback() {
    this.eventbus.broadcast(TimelineEventNames.FIRST_FRAME);
    this.eventbus.broadcast(TimelineEventNames.DURATION, [
      this._activeTimelineProvider?.getDuration,
    ]);
  }

  private _onRestartCallback() {
    this.eventbus.broadcast(TimelineEventNames.RESTART);
  }

  private async _cleanUp() {
    await this._cleanUpTimeline();
    await this._executeActions(
      [...this.configuration.initActions].reverse(),
      'end'
    );
  }

  /**
   * Cleans up all the necessary parts that the engine initialized.
   * - It ends the currently active operations and the init actions.
   * - It removes all its eventbus listeners, handlers and interceptors.
   * - It destroys all of its timeline providers
   * - It empties the HTML element indicated by the containerSelector configuration property.
   *
   */
  async destroy() {
    await this._cleanUp();

    this.languageManager.destroy();

    this._activeTimelineProvider = undefined;
    this._eventbusRemovers.forEach(remover => remover());

    if (this.timelineProviders) {
      Object.values(this.timelineProviders).forEach(providerInfo =>
        providerInfo.provider.destroy()
      );
    }

    const {containerSelector} = this.configuration;
    const container = $(containerSelector);
    container.empty();
  }

  private _addEventListener(
    eventName: string,
    eventHandler: TEventHandler,
    eventTopic?: string
  ) {
    this._eventbusRemovers.push(
      this.eventbus.on(eventName, eventHandler, eventTopic)
    );
  }

  private _addEventbusListeners() {
    this._addEventListener(
      TimelineEventNames.REQUEST_ENGINE_ROOT,
      this._handleRequestEngineRoot.bind(
        this,
        this.configuration.containerSelector
      )
    );
    this._addEventListener(
      TimelineEventNames.REQUEST_TIMELINE_URI,
      this._handleRequestTimelineUri.bind(this)
    );
    this._addEventListener(
      TimelineEventNames.REQUEST_CURRENT_TIMELINE_POSITION,
      this._handleRequestTimelinePosition.bind(this, Math.floor)
    );
    this._addEventListener(
      TimelineEventNames.REQUEST_TIMELINE_CLEANUP,
      this._handleTimelineComplete.bind(this)
    );
    this._addEventListener(
      TimelineEventNames.REQUEST_CURRENT_TIMELINE,
      this._requestCurrentTimeline.bind(this)
    );
    this._addEventListener(
      TimelineEventNames.PLAY_TOGGLE_REQUEST,
      this._toggleplay.bind(this)
    );

    this._addEventListener(
      TimelineEventNames.PLAY_REQUEST,
      this._playRequest.bind(this)
    );

    this._addEventListener(
      TimelineEventNames.STOP_REQUEST,
      this._stopRequest.bind(this)
    );

    this._addEventListener(
      TimelineEventNames.PAUSE_REQUEST,
      this._pauseRequest.bind(this)
    );

    this._addEventListener(
      TimelineEventNames.CONTAINER_REQUEST,
      this.containerRequest.bind(this)
    );

    this._addEventListener(
      TimelineEventNames.DURATION_REQUEST,
      this.durationRequest.bind(this)
    );

    this._addEventListener(
      TimelineEventNames.SEEK_REQUEST,
      this.seekRequest.bind(this)
    );
  }

  private async seekRequest(position: number) {
    if (!this._activeTimelineProvider) {
      return;
    }
    const seekPosition = Math.floor(position);

    const duration = this._activeTimelineProvider.getDuration();
    const currentPosition = this._activeTimelineProvider.getPosition();

    if (seekPosition < 0 || seekPosition > duration) {
      return;
    }

    this.eventbus.broadcast(TimelineEventNames.SEEK, [
      seekPosition,
      currentPosition,
      duration,
    ]);

    await this._activeTimelineProvider.seek(seekPosition);
    await this._executeSeekActions(seekPosition);

    this.eventbus.broadcast(TimelineEventNames.SEEKED, [
      this._activeTimelineProvider.getPosition(),
      duration,
    ]);

    this.eventbus.broadcast(TimelineEventNames.TIME, [
      this._activeTimelineProvider.getPosition(),
    ]);

    if (this._activeTimelineProvider?.playState === 'running') {
      this._activeTimelineProvider?.start();
    }
  }

  private durationRequest(callBack: TResultCallback<number | undefined>) {
    callBack(this._activeTimelineProvider?.getDuration());
  }

  private containerRequest(
    callBack: TResultCallback<JQuery<HTMLElement> | undefined>
  ) {
    callBack(this._activeTimelineProvider?.getContainer());
  }

  private _pauseRequest() {
    if (!this._activeTimelineProvider) {
      return;
    }

    this._activeTimelineProvider.pause();
    this.eventbus.broadcast(TimelineEventNames.PAUSE);
  }

  private _stopRequest() {
    if (!this._activeTimelineProvider) {
      return;
    }

    this._activeTimelineProvider.stop();
    this.eventbus.broadcast(TimelineEventNames.STOP);
  }

  private _playRequest() {
    if (!this._activeTimelineProvider) {
      return;
    }

    this._activeTimelineProvider.start();
    this.eventbus.broadcast(TimelineEventNames.PLAY);
  }

  private _toggleplay() {
    if (!this._activeTimelineProvider) {
      return;
    }

    if (this._activeTimelineProvider.playState === 'running') {
      this._activeTimelineProvider.pause();
    } else {
      this._activeTimelineProvider.start();
    }
  }

  private _createTimelineLookup() {
    if (!this.configuration.timelines) {
      return;
    }

    // Consolidated loop: process both start and end actions in a single pass
    this.configuration.timelines.forEach(timelineInfo => {
      // Populate timeline lookup cache for O(1) access
      this._timelineLookupCache.set(timelineInfo.uri, timelineInfo);

      timelineInfo.timelineActions.forEach(timelineAction => {
        this._addTimelineActionStart(timelineInfo.uri, timelineAction);
        this._addTimelineActionEnd(timelineInfo.uri, timelineAction);
      });
    });

    EligiusEngine.sortTimelines(Object.values(this._timeLineActionsLookup));
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

  private _addTimelineActionStart(
    uri: string,
    timeLineAction: ITimelineAction
  ) {
    const startPosition = timeLineAction.duration.start;
    const timelineStartPositions = this._initializeTimelinePosition(
      this._initializeUriLookup(this._timeLineActionsLookup, uri),
      startPosition
    );
    const startMethod = timeLineAction.start.bind(
      timeLineAction
    ) as ActionMethod;

    if (timeLineAction.id?.length) {
      startMethod.id = timeLineAction.id;
    }
    startMethod.isStart = true;

    timelineStartPositions.push(startMethod);
  }

  private _addTimelineActionEnd(uri: string, timeLineAction: ITimelineAction) {
    let end = timeLineAction.duration.end;
    if (end < 0) {
      end = timeLineAction.duration.end = Infinity;
    }

    if (isFinite(end)) {
      const timelineEndPositions = this._initializeTimelinePosition(
        this._timeLineActionsLookup[uri],
        end
      );
      const endMethod = timeLineAction.end.bind(timeLineAction) as ActionMethod;

      if (timeLineAction.id?.length) {
        endMethod.id = timeLineAction.id;
        endMethod.startPosition = timeLineAction.duration.start;
      }
      endMethod.isStart = false;

      timelineEndPositions.push(endMethod);
    }
  }

  private _initializeUriLookup(
    lookup: Record<string, Record<number, ActionMethod[]>>,
    uri: string
  ): Record<number, ActionMethod[]> {
    if (!lookup[uri]) {
      lookup[uri] = {};
    }

    return lookup[uri];
  }

  private _initializeTimelinePosition(
    lookup: Record<number, ActionMethod[]>,
    position: number
  ): ActionMethod[] {
    if (!lookup[position]) {
      lookup[position] = [] as ActionMethod[];
    }

    return lookup[position];
  }

  private async _executeActions(
    actions: IEndableAction[],
    methodName: 'start' | 'end'
  ): Promise<void> {
    // Iterative implementation (converted from recursive)
    if (actions.length === 0) {
      return;
    }

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

  private async _handleRequestTimelineUri(uri: string, position: number = 0) {
    if (!this._activeTimelineProvider) {
      return;
    }

    this._activeTimelineProvider.stop();

    await this._cleanUpTimeline();

    const timelineConfig = this._timelineLookupCache.get(uri);
    if (
      !timelineConfig ||
      !this._activeTimelineProvider ||
      this._currentTimelineUri === timelineConfig.uri
    ) {
      return;
    }
    this._currentTimelineUri = timelineConfig.uri;

    this.eventbus.broadcast(TimelineEventNames.CURRENT_TIMELINE_CHANGE, [
      this._currentTimelineUri,
    ]);

    const newProviderSettings = this.timelineProviders[timelineConfig.type];

    if (this._activeTimelineProvider !== newProviderSettings.provider) {
      this._activeTimelineProvider.destroy();
      this._activeTimelineProvider = newProviderSettings.provider;
    }

    this._activeTimelineProvider.loop = timelineConfig.loop;

    if (!this._activeTimelineProvider.loop && position > 0) {
      this.eventbus.once(TimelineEventNames.FIRST_FRAME, async () => {
        if (!this._activeTimelineProvider) {
          return;
        }

        this._activeTimelineProvider.pause();
        this.eventbus.broadcast(TimelineEventNames.DURATION, [
          this._activeTimelineProvider.getDuration(),
        ]);

        await this._executeStartActions();

        const seekPosition = await this._activeTimelineProvider.seek(position);
        this.seekRequest(seekPosition);
      });
    }

    this._activeTimelineProvider.playlistItem(uri);
  }

  private _cleanUpTimeline() {
    return this._executeRelevantActions(this._getActiveActions, 'end');
  }

  private _executeStartActions() {
    return this._executeRelevantActions(
      this._getActionsForPosition.bind(this, 0),
      'start'
    );
  }

  /**
   * Gets all of the inactive actions whose duration falls within the given timeline position.
   *
   * @param position the given position
   * @param actions all of the relevant actions
   * @returns
   */
  private _getActionsForPosition(position: number, actions: ITimelineAction[]) {
    return actions.filter(
      action =>
        !action.active &&
        action.duration.start <= position &&
        action.duration.end >= position
    );
  }

  private _getActiveActions(allActions: ITimelineAction[]) {
    const actions = allActions.filter(action => action.active);
    return actions.sort(sortActionsHighestStartPositionFirst);
  }

  private _executeRelevantActions(
    filter: (actions: ITimelineAction[]) => ITimelineAction[],
    executionType: 'start' | 'end'
  ) {
    const timelineActions = this._getTimelineActionsForCurrentTimeline();
    const currentActions = filter.apply(this, [timelineActions]);
    return this._executeActions(currentActions, executionType);
  }

  private _handleRequestTimelinePosition(
    floor: Function,
    resultCallback: TResultCallback<number>
  ) {
    resultCallback(floor(this._activeTimelineProvider?.getPosition() || -1));
  }

  private _handleTimelineComplete() {
    this._cleanUpTimeline();
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

  private _onTimeHandler(floor: (x: number) => number, position: number) {
    if (!isNaN(position)) {
      const pos = floor(position);

      if (this._lastPosition !== pos) {
        this._executeActionsForPosition(pos);
        this.eventbus.broadcast(TimelineEventNames.TIME, [pos]);
      }
    }
  }

  private _executeActionsForPosition(position: number) {
    this._lastPosition = position;
    const actions = this._timeLineActionsLookup[this._currentTimelineUri];

    if (actions) {
      const executions = actions[position];
      executions?.forEach(exec => exec());
    }
  }

  private async _executeSeekActions(position: number) {
    const timelineActions = this._getTimelineActionsForCurrentTimeline();

    if (!timelineActions) {
      return Promise.resolve();
    }

    const currentActions = this._getActiveActions(timelineActions).filter(
      action =>
        !(action.duration.start <= position && action.duration.end >= position)
    );
    const newActions = this._getActionsForPosition(position, timelineActions);
    await this._executeActions(currentActions, 'end');
    return this._executeActions(newActions, 'start');
  }
}

const sortActionsHighestStartPositionFirst = (
  a: ITimelineAction,
  b: ITimelineAction
) => {
  if (b.duration.start < a.duration.start) {
    return -1;
  } else if (b.duration.start > a.duration.start) {
    return 1;
  } else {
    return 0;
  }
};

const sortActionMethodsHighestStartPositionFirst = (
  a: ActionMethod,
  b: ActionMethod
) => {
  if (b.startPosition === undefined || a.startPosition === undefined) {
    return 0;
  }
  if (b.startPosition < a.startPosition) {
    return -1;
  } else if (b.startPosition > a.startPosition) {
    return 1;
  } else {
    return 0;
  }
};
