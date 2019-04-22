import LanguageManager from './language-manager';
import $ from 'jquery';
import TimelineEventNames from './timeline-event-names';

class ChronoTriggerEngine {

    constructor(configuration, eventbus, timelineProvider) {
        this.configuration = configuration;
        this.eventbus = eventbus;
        this.timelineProvider = timelineProvider;
        this._timeLineActionsLookup = {};
        this._eventbusListeners = [];
    }

    init() {
        this._createLayoutTemplate();

        this._addInitialisationListeners();

        this.languageManager = new LanguageManager(this.configuration.language, this.configuration.labels, this.eventbus);

        const { timelines } = this.configuration;
        this._currentVideoUri = (timelines && timelines.length) ? timelines[0].uri : null;

        this._createTimelineLookup();

        return this._initializeTimelineProvider();
    }

    _createLayoutTemplate() {
        const container = $(this.configuration.containerSelector);
        if (!container || !container.length) {
            throw new Error(`Container selector not found: ${this.configuration.containerSelector}`);
        }
        const { layoutTemplate } = this.configuration; 
        if (layoutTemplate && layoutTemplate.length) {
            container.html(layoutTemplate);
        }
    }

    _initializeTimelineProvider() {
        if (!this.configuration.timelineProviderSettings) {
            return;
        }

        const playerContainer = $(`#${this.configuration.timelineProviderSettings.selector}`);

        if (playerContainer.length) {
            return new Promise((resolve) => {
                this.timelineProvider.init().then(() => {
                    this._executeActions((this.configuration.initActions), "start").then(() => {
                        this.timelineProvider.on(TimelineEventNames.TIME, this._onTimeHandler.bind(this, Math.floor));
                        this.timelineProvider.on(TimelineEventNames.SEEK, this._onSeekHandler.bind(this, Math.floor));
                        resolve(this.timelineProvider);
                    });
                });
            });
        }

        return new Promise((resolve)=> {
            resolve();
        });
    }

    destroy() {
        this.configuration = null;
        this.eventbus = null;
        this.timelineProvider = null;
        this._timeLineActionsLookup = null;
        this._eventbusListeners.forEach(func => func());
        if (this.timelineProvider) {
            this.timelineProvider.destroy();
        }
    }

    _addInitialisationListeners() {
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.REQUEST_ENGINE_ROOT, this._handleRequestEngineRoot.bind(this, this.configuration.containerSelector)));
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.REQUEST_TIMELINE_URI, this._handleRequestTimelineUri.bind(this)));
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.REQUEST_CURRENT_TIMELINE_POSITION, this._handleRequestTimelinePosition.bind(this)));
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.REQUEST_TIMELINE_CLEANUP, this._handleTimelineComplete.bind(this)));
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.EXECUTE_TIMELINEACTION, this._handleExecuteTimelineAction.bind(this)));
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.RESIZE_TIMELINEACTION, this._resizeTimelineAction.bind(this)));
    }

    _createTimelineLookup() {
        if (!this.configuration.timelines) {
            return;
        }
        this.configuration.timelines.forEach((timelineInfo) => {
            timelineInfo.timelineActions.forEach(this._addTimelineAction.bind(this, timelineInfo.uri));
        });
    }

    _addTimelineAction(uri, timeLineAction) {
        const start = timeLineAction.duration.start;
        const timelineStartPositions = this._initializeTimelinePosition(this._initializeUriLookup(this._timeLineActionsLookup, uri), start);
        const startMethod = timeLineAction.start.bind(timeLineAction);
        timelineStartPositions.push(startMethod);

        let end = timeLineAction.duration.end;
        if ((!end) || (isNaN(end))) {
            end = timeLineAction.duration.end = Infinity;
        }
        if (isFinite(end)) {
            const timelineEndPositions = this._initializeTimelinePosition(this._timeLineActionsLookup[uri], end);
            const endMethod = timeLineAction.end.bind(timeLineAction);
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

    _executeActions(actions, methodName, idx=0) {
        if (idx < actions.length) {
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

    _handleRequestEngineRoot(engineRootSelector, resultCallback) {
        resultCallback($(engineRootSelector));
    }

    _handleRequestTimelineUri(index, position, previousVideoPosition) {
        position = position || 0;
        previousVideoPosition = previousVideoPosition || 0;
        this.timelineProvider.stop();
        this._cleanUpTimeline().then(() => {
            const timelineConfig = this.configuration.timelines[index];
            this._currentVideoUri = timelineConfig.uri;
            this.timelineProvider.loop = timelineConfig.loop;
            if ((!this.timelineProvider.loop) && (position > 0)) {
                this.timelineProvider.once(TimelineEventNames.FIRST_FRAME, () => {
                    this.timelineProvider.pause();
                    this.eventbus.broadcastForTopic(TimelineEventNames.DURATION, this.timelineProvider.playerid, [this.getDuration()]);
                    this._executeStartActions().then(() => {
                        this.timelineProvider.seek(position);
                        this._onSeekHandler(Math.floor, { offset: position });
                    });
                });
            }
            this.timelineProvider.playlistItem(index);
        });
    }

    _cleanUpTimeline() {
        return this._executeRelevantActions(this._getActiveActions, "end");
    }

    _executeStartActions() {
        return this._executeRelevantActions(this._getActionsForPosition.bind(this, 0), "start");
    }

    _getActionsForPosition(position, allActions) {
        return allActions.filter((action) => {
            return (!action.active) && ((action.duration.start <= position) && (action.duration.end >= position));
        });
    }

    _getActiveActions(allActions) {
        const actions = allActions.filter((action) => {
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

    _handleRequestTimelinePosition(resultCallback) {
        resultCallback(Math.floor(this.timelineProvider.getPosition()));
    }

    _handleTimelineComplete() {
        this._cleanUpTimeline();
    }

    _handleExecuteTimelineAction(uri, index, start) {
        const actions = this._getTimelineActionsForUri(uri);
        const action = (actions) ? actions[index] : null;
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
        const action = (actions) ? actions[index] : null;
        if (action) {
            action.resize();
        }
    }

    _getRelevantTimelineActions() {
        return this._getTimelineActionsForUri(this._currentVideoUri);
    }

    _getTimelineActionsForUri(uri) {
        let timelineActions;
        this.configuration.timelines.some((timelineInfo) => {
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
                this.eventbus.broadcastForTopic(TimelineEventNames.POSITION_UPDATE, this.timelineProvider.playerid, [pos, this.timelineProvider.getDuration()]);
            }
            this.eventbus.broadcastForTopic(TimelineEventNames.TIME_UPDATE, this.timelineProvider.playerid, [event.position, this.timelineProvider.getDuration()]);
        }
    }

    _onSeekHandler(floor, event) {
        const pos = floor(event.offset);
        if (isNaN(pos)) {
            return;
        }
        this._executeSeekActions(pos).then(() => {
            this.timelineProvider.play();
        });
    }

    _executeActionsForPosition(position) {
        this._lastPosition = position;
        const actions = this._timeLineActionsLookup[this._currentVideoUri];
        if (actions) {
            const executions = actions[position];
            if (executions) {
                executions.forEach((exec) => {
                    exec();
                });
            }
        }
    }

    _executeSeekActions(pos) {
        const timelineActions = this._getRelevantTimelineActions();
        const currentActions = this._getActiveActions(timelineActions);
        const newActions = this._getActionsForPosition(pos, timelineActions);

        const promise = this._executeActions(currentActions, "end", 0);

        return new Promise((resolve) => {
            promise.then(() => {
                this._executeActions(newActions, "start", 0).then(() => {
                    resolve();
                });
            });
        });
    }
}

export default ChronoTriggerEngine;
