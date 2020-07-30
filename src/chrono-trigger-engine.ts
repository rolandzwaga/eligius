import $ from 'jquery';
import TimelineEventNames from './timeline-event-names';
import {
  IChronoTriggerEngine,
  IResolvedEngineConfiguration,
  TimelineTypes,
  ITimelineProviderInfo,
  TResultCallback,
} from './types';
import { IEventbus, TEventHandlerRemover } from './eventbus/types';
import { ITimelineProvider } from './timelineproviders/types';
import LanguageManager from './language-manager';
import { TimelineAction } from './action';
import { TOperation, IEndableAction, ITimelineAction } from './action/types';

/**
 * ChronoTriggerEngine, this is where the magic happens. The engine is responsible for starting and stoppping
 * the given timeline provider and triggering the actions associated with it.
 * ...
 */
class ChronoTriggerEngine implements IChronoTriggerEngine {
  #timeLineActionsLookup: Record<string, any> = {};
  #eventbusListeners: TEventHandlerRemover[] = [];
  #currentTimelineUri: string = '';
  #activeTimelineProvider: ITimelineProvider | undefined = undefined;
  #lastPosition: number = -1;

  constructor(
    private configuration: IResolvedEngineConfiguration,
    private eventbus: IEventbus,
    private timelineProviders: Record<TimelineTypes, ITimelineProviderInfo>,
    private languageManager: LanguageManager
  ) {}

  init(): Promise<ITimelineProvider> {
    this._createLayoutTemplate();

    this._addInitialisationListeners();

    const { timelines } = this.configuration;

    this.#currentTimelineUri = timelines && timelines.length ? timelines[0].uri : '';

    this._createTimelineLookup();

    this.#eventbusListeners.push(this.eventbus.on(TimelineEventNames.TIME, this._onTimeHandler.bind(this, Math.floor)));
    this.#eventbusListeners.push(this.eventbus.on(TimelineEventNames.SEEK, this._onSeekHandler.bind(this, Math.floor)));

    return this._initializeTimelineProvider();
  }

  _createLayoutTemplate() {
    const { containerSelector } = this.configuration;
    const container = $(containerSelector);
    if (!container || !container.length) {
      throw new Error(`Container selector not found: ${containerSelector}`);
    }
    const { layoutTemplate } = this.configuration;
    if (layoutTemplate && layoutTemplate.length) {
      container.html(layoutTemplate);
    } else {
      console.warn('layoutTemplate is empty, unable to create layout');
    }
  }

  _initializeTimelineProvider(): Promise<ITimelineProvider> {
    if (!this.configuration.timelines?.length) {
      return Promise.resolve<any>(undefined);
    }

    const firstTimeline = this.configuration.timelines[0];
    const providerSettings = this.timelineProviders[firstTimeline.type];

    if (!providerSettings) {
      throw new Error(`No timeline provider configured for type ${firstTimeline.type}`);
    }

    if (this.#activeTimelineProvider) {
      this.#activeTimelineProvider.destroy();
    }
    this.#activeTimelineProvider = providerSettings.provider;

    return new Promise((resolve) => {
      if (this.#activeTimelineProvider) {
        this.#activeTimelineProvider.init().then(() => {
          this._executeActions(this.configuration.initActions, 'start').then(() => {
            resolve(this.#activeTimelineProvider);
          });
        });
      } else {
        resolve();
      }
    });
  }

  async _cleanUp() {
    await this._cleanUpTimeline();
    await this._executeActions(this.configuration.initActions, 'end');
  }

  async destroy() {
    await this._cleanUp();
    this.#activeTimelineProvider = undefined;
    this.#eventbusListeners.forEach((remover) => remover());
    if (this.timelineProviders) {
      Object.values(this.timelineProviders).forEach((info) => info.provider.destroy());
    }
  }

  _addInitialisationListeners() {
    this.#eventbusListeners.push(
      this.eventbus.on(
        TimelineEventNames.REQUEST_ENGINE_ROOT,
        this._handleRequestEngineRoot.bind(this, this.configuration.containerSelector)
      )
    );
    this.#eventbusListeners.push(
      this.eventbus.on(TimelineEventNames.REQUEST_TIMELINE_URI, this._handleRequestTimelineUri.bind(this))
    );
    this.#eventbusListeners.push(
      this.eventbus.on(
        TimelineEventNames.REQUEST_CURRENT_TIMELINE_POSITION,
        this._handleRequestTimelinePosition.bind(this, Math.floor)
      )
    );
    this.#eventbusListeners.push(
      this.eventbus.on(TimelineEventNames.REQUEST_TIMELINE_CLEANUP, this._handleTimelineComplete.bind(this))
    );
    this.#eventbusListeners.push(
      this.eventbus.on(TimelineEventNames.EXECUTE_TIMELINEACTION, this._handleExecuteTimelineAction.bind(this))
    );
    this.#eventbusListeners.push(
      this.eventbus.on(TimelineEventNames.RESIZE_TIMELINEACTION, this._resizeTimelineAction.bind(this))
    );
    this.#eventbusListeners.push(
      this.eventbus.on(TimelineEventNames.REQUEST_CURRENT_TIMELINE, this._requestCurrentTimeline.bind(this))
    );
  }

  _createTimelineLookup() {
    if (!this.configuration.timelines) {
      return;
    }
    this.configuration.timelines.forEach((timelineInfo) => {
      timelineInfo.timelineActions.forEach(this._addTimelineAction.bind(this, timelineInfo.uri));
    });
  }

  _addTimelineAction(uri: string, timeLineAction: TimelineAction) {
    const startPosition = timeLineAction.duration.start;
    const timelineStartPositions = this._initializeTimelinePosition(
      this._initializeUriLookup(this.#timeLineActionsLookup, uri),
      startPosition
    );
    const startMethod = timeLineAction.start.bind(timeLineAction);

    if (timeLineAction.id.length) {
      (startMethod as any).id = timeLineAction.id;
      (startMethod as any).isStart = true;
    }

    timelineStartPositions.push(startMethod);

    let end = timeLineAction.duration.end;
    if (!end || isNaN(end)) {
      end = timeLineAction.duration.end = Infinity;
    }

    if (isFinite(end)) {
      const timelineEndPositions = this._initializeTimelinePosition(this.#timeLineActionsLookup[uri], end);
      const endMethod = timeLineAction.end.bind(timeLineAction);

      if (timeLineAction.id.length) {
        (endMethod as any).id = timeLineAction.id;
      }

      timelineEndPositions.push(endMethod);
    }
  }

  _initializeUriLookup(lookup: Record<string, any>, uri: string): Record<number, any> {
    if (!lookup[uri]) {
      lookup[uri] = {};
    }
    return lookup[uri];
  }

  _initializeTimelinePosition(lookup: Record<number, any>, position: number): TOperation[] {
    if (!lookup[position]) {
      lookup[position] = [];
    }
    return lookup[position];
  }

  _executeActions(actions: IEndableAction[], methodName: 'start' | 'end', idx = 0): Promise<any> {
    if (actions && idx < actions.length) {
      const action = actions[idx];

      const promise = action[methodName]();
      return promise.then(() => {
        return this._executeActions(actions, methodName, ++idx);
      });
    }
    return new Promise((resolve) => {
      resolve();
    });
  }

  _handleRequestEngineRoot(engineRootSelector: string, resultCallback: TResultCallback) {
    resultCallback($(engineRootSelector));
  }

  _handleRequestTimelineUri(uri: string, position: number, previousVideoPosition: number) {
    if (!this.#activeTimelineProvider) {
      return;
    }

    position = position || 0;
    previousVideoPosition = previousVideoPosition || 0;
    this.#activeTimelineProvider.stop();

    this._cleanUpTimeline().then(() => {
      const timelineConfig = this.configuration.timelines.find((timeline) => timeline.uri === uri);
      if (!timelineConfig || !this.#activeTimelineProvider) {
        return;
      }
      this.#currentTimelineUri = timelineConfig.uri;

      this.eventbus.broadcast(TimelineEventNames.CURRENT_TIMELINE_CHANGE, [this.#currentTimelineUri]);

      const newProviderSettings = this.timelineProviders[timelineConfig.type];

      if (this.#activeTimelineProvider !== newProviderSettings.provider) {
        this.#activeTimelineProvider.destroy();
        this.#activeTimelineProvider = newProviderSettings.provider;
      }

      this.#activeTimelineProvider.loop = timelineConfig.loop;

      if (!this.#activeTimelineProvider.loop && position > 0) {
        this.eventbus.once(TimelineEventNames.FIRST_FRAME, () => {
          if (!this.#activeTimelineProvider) {
            return;
          }

          this.#activeTimelineProvider.pause();
          this.eventbus.broadcast(TimelineEventNames.DURATION, [this.#activeTimelineProvider.getDuration()]);
          this._executeStartActions().then(() => {
            this.#activeTimelineProvider?.seek(position);
            this._onSeekHandler(Math.floor, {
              offset: position,
            });
          });
        });
      }

      this.#activeTimelineProvider.playlistItem(uri);
    });
  }

  _cleanUpTimeline() {
    return this._executeRelevantActions(this._getActiveActions, 'end');
  }

  _executeStartActions() {
    return this._executeRelevantActions(this._getActionsForPosition.bind(this, 0), 'start');
  }

  _getActionsForPosition(position: number, allActions: ITimelineAction[]) {
    return allActions.filter((action) => {
      return !action.active && action.duration.start <= position && action.duration.end >= position;
    });
  }

  _getActiveActions(allActions: ITimelineAction[]) {
    const actions = allActions.filter((action) => action.active);
    return actions.sort((a, b) => {
      if (b.duration.start < a.duration.start) {
        return -1;
      } else if (b.duration.start > a.duration.start) {
        return 1;
      } else {
        return 0;
      }
    });
  }

  _executeRelevantActions(filter: Function, executionType: 'start' | 'end') {
    const timelineActions = this._getRelevantTimelineActions();
    const currentActions = filter.apply(this, [timelineActions]);
    return this._executeActions(currentActions, executionType, 0);
  }

  _handleRequestTimelinePosition(floor: Function, resultCallback: TResultCallback) {
    resultCallback(floor(this.#activeTimelineProvider?.getPosition() || -1));
  }

  _handleTimelineComplete() {
    this._cleanUpTimeline();
  }

  _handleExecuteTimelineAction(uri: string, index: number, start: boolean) {
    const actions = this._getTimelineActionsForUri(uri);
    const action = actions ? actions[index] : null;
    if (action) {
      if (start) {
        action.start();
      } else {
        action.end();
      }
    }
  }

  _resizeTimelineAction(/*uri: string, index: number*/) {
    console.error('no resizing implemented');
  }

  _getRelevantTimelineActions() {
    return this._getTimelineActionsForUri(this.#currentTimelineUri);
  }

  _requestCurrentTimeline(resultCallback: TResultCallback) {
    resultCallback(this.#currentTimelineUri);
  }

  _getTimelineActionsForUri(uri: string): ITimelineAction[] {
    let timelineActions: ITimelineAction[] = [];
    this.configuration.timelines.some((timelineInfo) => {
      if (timelineInfo.uri === uri) {
        timelineActions = timelineInfo.timelineActions;
        return true;
      }
      return false;
    });
    return timelineActions;
  }

  _onTimeHandler(floor: Function, event: any) {
    if (!isNaN(event.position)) {
      const pos = floor(event.position);
      if (this.#lastPosition !== pos) {
        this._executeActionsForPosition(pos);
        this.eventbus.broadcast(TimelineEventNames.POSITION_UPDATE, [pos, this.#activeTimelineProvider?.getDuration()]);
      }
      this.eventbus.broadcast(TimelineEventNames.TIME_UPDATE, [
        event.position,
        this.#activeTimelineProvider?.getDuration(),
      ]);
    }
  }

  _onSeekHandler(floor: Function, event: { offset: number }) {
    const pos = floor(event.offset);
    if (isNaN(pos)) {
      return;
    }
    this._executeSeekActions(pos).then(() => {
      this.#activeTimelineProvider?.start();
    });
  }

  _executeActionsForPosition(position: number) {
    this.#lastPosition = position;
    const actions = this.#timeLineActionsLookup[this.#currentTimelineUri];
    if (actions) {
      const executions = actions[position];
      if (executions) {
        executions.forEach((exec: () => void) => {
          exec();
        });
      }
    }
  }

  _executeSeekActions(pos: number) {
    const timelineActions = this._getRelevantTimelineActions();
    if (!timelineActions) {
      return Promise.resolve();
    }
    const currentActions = this._getActiveActions(timelineActions);
    const newActions = this._getActionsForPosition(pos, timelineActions);

    const promise = this._executeActions(currentActions, 'end', 0);

    return new Promise((resolve) => {
      promise.then(() => {
        this._executeActions(newActions, 'start', 0).then(() => {
          resolve();
        });
      });
    });
  }
}

export default ChronoTriggerEngine;
