import LanguageManager from './language-manager';
import $ from 'jquery';
import TimelineEventNames from './timeline-event-names';

/**
 * ChronoTriggerEngine, this is where the magic happens. The engine is responsible for starting and stoppping
 * the given timeline provider and triggering the actions associated with it.
 * ...
 */
class ChronoTriggerEngine {
  constructor(configuration, eventbus, timelineProvider, languageManager) {
    this._configuration = configuration;
    this._eventbus = eventbus;
    this._timelineProvider = timelineProvider;
    this._timeLineActionsLookup = {};
    this._eventbusListeners = [];
    this._languageManager = languageManager;
  }

  init() {
    this._createLayoutTemplate();

    this._addInitialisationListeners();

    const { timelines } = this._configuration;

    this._currentTimelineUri = timelines && timelines.length ? timelines[0].uri : null;

    this._createTimelineLookup();

    return this._initializeTimelineProvider();
  }

  _createLayoutTemplate() {
    const { containerSelector } = this._configuration;
    const container = $(containerSelector);
    if (!container || !container.length) {
      throw new Error(`Container selector not found: ${containerSelector}`);
    }
    const { layoutTemplate } = this._configuration;
    if (layoutTemplate && layoutTemplate.length) {
      container.html(layoutTemplate);
    } else {
      console.warning('layoutTemplate is empty, unable to create layout');
    }
  }

  _initializeTimelineProvider() {
    const { timelineProviderSettings } = this._configuration;
    if (!timelineProviderSettings) {
      return;
    }

    const playerContainer = $(`#${timelineProviderSettings.selector}`);

    if (playerContainer.length) {
      return new Promise(resolve => {
        this._timelineProvider.init().then(() => {
          this._executeActions(this._configuration.initActions, 'start').then(() => {
            this._timelineProvider.on(TimelineEventNames.TIME, this._onTimeHandler.bind(this, Math.floor));
            this._timelineProvider.on(TimelineEventNames.SEEK, this._onSeekHandler.bind(this, Math.floor));
            resolve(this._timelineProvider);
          });
        });
      });
    }

    return new Promise(resolve => {
      resolve();
    });
  }

  async _cleanUp() {
    await this._cleanUpTimeline();
    await this._executeActions(this._configuration.initActions, 'end');
  }

  async destroy() {
    await this._cleanUp();
    this._configuration = null;
    this._eventbus = null;
    this._timelineProvider = null;
    this._timeLineActionsLookup = null;
    this._eventbusListeners.forEach(remover => remover());
    if (this._timelineProvider) {
      this._timelineProvider.destroy();
    }
  }

  _addInitialisationListeners() {
    this._eventbusListeners.push(
      this._eventbus.on(
        TimelineEventNames.REQUEST_ENGINE_ROOT,
        this._handleRequestEngineRoot.bind(this, this._configuration.containerSelector)
      )
    );
    this._eventbusListeners.push(
      this._eventbus.on(TimelineEventNames.REQUEST_TIMELINE_URI, this._handleRequestTimelineUri.bind(this))
    );
    this._eventbusListeners.push(
      this._eventbus.on(
        TimelineEventNames.REQUEST_CURRENT_TIMELINE_POSITION,
        this._handleRequestTimelinePosition.bind(this, Math.floor)
      )
    );
    this._eventbusListeners.push(
      this._eventbus.on(TimelineEventNames.REQUEST_TIMELINE_CLEANUP, this._handleTimelineComplete.bind(this))
    );
    this._eventbusListeners.push(
      this._eventbus.on(TimelineEventNames.EXECUTE_TIMELINEACTION, this._handleExecuteTimelineAction.bind(this))
    );
    this._eventbusListeners.push(
      this._eventbus.on(TimelineEventNames.RESIZE_TIMELINEACTION, this._resizeTimelineAction.bind(this))
    );
  }

  _createTimelineLookup() {
    if (!this._configuration.timelines) {
      return;
    }
    this._configuration.timelines.forEach(timelineInfo => {
      timelineInfo.timelineActions.forEach(this._addTimelineAction.bind(this, timelineInfo.uri));
    });
  }

  _addTimelineAction(uri, timeLineAction) {
    const start = timeLineAction.duration.start;
    const timelineStartPositions = this._initializeTimelinePosition(
      this._initializeUriLookup(this._timeLineActionsLookup, uri),
      start
    );
    const startMethod = timeLineAction.start.bind(timeLineAction);

    if (timeLineAction.id) {
      startMethod.id = timeLineAction.id;
      startMethod.isStart = true;
    }
    timelineStartPositions.push(startMethod);

    let end = timeLineAction.duration.end;
    if (!end || isNaN(end)) {
      end = timeLineAction.duration.end = Infinity;
    }

    if (isFinite(end)) {
      const timelineEndPositions = this._initializeTimelinePosition(this._timeLineActionsLookup[uri], end);
      const endMethod = timeLineAction.end.bind(timeLineAction);
      if (timeLineAction.id) {
        endMethod.id = timeLineAction.id;
      }
      timelineEndPositions.push(endMethod);
    }
  }

  _initializeUriLookup(lookup, uri) {
    if (!lookup[uri]) {
      lookup[uri] = {};
    }
    return lookup[uri];
  }

  _initializeTimelinePosition(lookup, position) {
    if (!lookup[position]) {
      lookup[position] = [];
    }
    return lookup[position];
  }

  _executeActions(actions, methodName, idx = 0) {
    if (idx < actions.length) {
      const action = actions[idx];

      const promise = action[methodName]();
      return promise.then(() => {
        return this._executeActions(actions, methodName, ++idx);
      });
    }
    return new Promise(resolve => {
      resolve();
    });
  }

  _handleRequestEngineRoot(engineRootSelector, resultCallback) {
    resultCallback($(engineRootSelector));
  }

  _handleRequestTimelineUri(index, position, previousVideoPosition) {
    position = position || 0;
    previousVideoPosition = previousVideoPosition || 0;
    this._timelineProvider.stop();
    this._cleanUpTimeline().then(() => {
      const timelineConfig = this._configuration.timelines[index];
      this._currentTimelineUri = timelineConfig.uri;
      this._timelineProvider.loop = timelineConfig.loop;
      if (!this._timelineProvider.loop && position > 0) {
        this._timelineProvider.once(TimelineEventNames.FIRST_FRAME, () => {
          this._timelineProvider.pause();
          this._eventbus.broadcastForTopic(TimelineEventNames.DURATION, this._timelineProvider.playerid, [
            this.getDuration(),
          ]);
          this._executeStartActions().then(() => {
            this._timelineProvider.seek(position);
            this._onSeekHandler(Math.floor, {
              offset: position,
            });
          });
        });
      }
      this._timelineProvider.playlistItem(index);
    });
  }

  _cleanUpTimeline() {
    return this._executeRelevantActions(this._getActiveActions, 'end');
  }

  _executeStartActions() {
    return this._executeRelevantActions(this._getActionsForPosition.bind(this, 0), 'start');
  }

  _getActionsForPosition(position, allActions) {
    return allActions.filter(action => {
      return !action.active && action.duration.start <= position && action.duration.end >= position;
    });
  }

  _getActiveActions(allActions) {
    const actions = allActions.filter(action => {
      return action.active;
    });
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

  _executeRelevantActions(filter, executionType) {
    const timelineActions = this._getRelevantTimelineActions();
    const currentActions = filter.apply(this, [timelineActions]);
    return this._executeActions(currentActions, executionType, 0);
  }

  _handleRequestTimelinePosition(floor, resultCallback) {
    resultCallback(floor(this._timelineProvider.getPosition()));
  }

  _handleTimelineComplete() {
    this._cleanUpTimeline();
  }

  _handleExecuteTimelineAction(uri, index, start) {
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

  _resizeTimelineAction(uri, index) {
    const actions = this._getTimelineActionsForUri(uri);
    const action = actions ? actions[index] : null;
    if (action) {
      action.resize();
    }
  }

  _getRelevantTimelineActions() {
    return this._getTimelineActionsForUri(this._currentTimelineUri);
  }

  _getTimelineActionsForUri(uri) {
    let timelineActions;
    this._configuration.timelines.some(timelineInfo => {
      if (timelineInfo.uri === uri) {
        timelineActions = timelineInfo.timelineActions;
        return true;
      }
      return false;
    });
    return timelineActions;
  }

  _onTimeHandler(floor, event) {
    if (!isNaN(event.position)) {
      const pos = floor(event.position);
      if (this._lastPosition !== pos) {
        this._executeActionsForPosition(pos);
        this._eventbus.broadcastForTopic(TimelineEventNames.POSITION_UPDATE, this._timelineProvider.playerid, [
          pos,
          this._timelineProvider.getDuration(),
        ]);
      }
      this._eventbus.broadcastForTopic(TimelineEventNames.TIME_UPDATE, this._timelineProvider.playerid, [
        event.position,
        this._timelineProvider.getDuration(),
      ]);
    }
  }

  _onSeekHandler(floor, event) {
    const pos = floor(event.offset);
    if (isNaN(pos)) {
      return;
    }
    this._executeSeekActions(pos).then(() => {
      this._timelineProvider.play();
    });
  }

  _executeActionsForPosition(position) {
    this._lastPosition = position;
    const actions = this._timeLineActionsLookup[this._currentTimelineUri];
    if (actions) {
      const executions = actions[position];
      if (executions) {
        executions.forEach(exec => {
          exec();
        });
      }
    }
  }

  _executeSeekActions(pos) {
    const timelineActions = this._getRelevantTimelineActions();
    const currentActions = this._getActiveActions(timelineActions);
    const newActions = this._getActionsForPosition(pos, timelineActions);

    const promise = this._executeActions(currentActions, 'end', 0);

    return new Promise(resolve => {
      promise.then(() => {
        this._executeActions(newActions, 'start', 0).then(() => {
          resolve();
        });
      });
    });
  }
}

export default ChronoTriggerEngine;
