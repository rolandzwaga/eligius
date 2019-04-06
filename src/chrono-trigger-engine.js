import LanguageManager from './language-manager';
import $ from 'jquery';

class ChronoTriggerEngine {

    constructor(configuration, eventbus, timelineProvider) {
        this.configuration = configuration;
        this.eventbus = eventbus;
        this.timelineProvider = timelineProvider;
        this._timeLineActionsLookup = {};
        this._eventbusListeners = [];
    }

    init() {
        this.createLayoutTemplate();

        this.addInitialisationListeners();

        this.languageManager = new LanguageManager(this.configuration.language, this.configuration.labels, this.eventbus);

        this._currentVideoUrl = (this.configuration.videourls.length) ? this.configuration.videourls[0].url : null;

        return this.initializeTimelineProvider();
    }

    createLayoutTemplate() {
        const container = $(this.configuration.containerSelector);
        if (!container.length) {
            throw new Error(`Container selector not found: ${this.configuration.containerSelector}`);
        }
        const { layoutTemplate } = this.configuration; 
        if (layoutTemplate && layoutTemplate.length) {
            container.html(layoutTemplate);
        }
    }

    initializeTimelineProvider() {
        this.createTimelineLookup();
        const playerContainer = $(`#${this.configuration.playerSettings.selector}`);
        if (playerContainer.length) {
            return new Promise((resolve) => {
                this.timelineProvider.init().then(() => {
                    this.executeActions((this.configuration.initActions), "start").then(() => {
                        this.timelineProvider.on("time", this.onTimeHandler.bind(this, Math.floor));
                        this.timelineProvider.on("seek", this.onSeekHandler.bind(this, Math.floor));
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

    addInitialisationListeners() {
        this._eventbusListeners.push(this.eventbus.on("request-engine-root", this.handleRequestEngineRoot.bind(this, this.configuration.containerSelector)));
        this._eventbusListeners.push(this.eventbus.on("request-video-url", this.handleRequestVideoUrl.bind(this)));
        this._eventbusListeners.push(this.eventbus.on("request-current-video-position", this.handleRequestVideoPosition.bind(this)));
        this._eventbusListeners.push(this.eventbus.on("request-video-cleanup", this.handleVideoComplete.bind(this)));
        this._eventbusListeners.push(this.eventbus.on("execute-timelineaction", this.handleExecuteTimelineAction.bind(this)));
        this._eventbusListeners.push(this.eventbus.on("resize-timelineaction", this.resizeTimelineAction.bind(this)));
    }

    createTimelineLookup() {
        this.configuration.videourls.forEach((urlInfo) => {
            urlInfo.timelineActions.forEach(this.addTimelineAction.bind(this, urlInfo.url));
        });
    }

    addTimelineAction(url, timeLineAction) {
        const start = timeLineAction.duration.start;
        const videoStartPositions = this.initializeVideoPosition(this.initializeUrlLookup(this._timeLineActionsLookup, url), start);
        const startMethod = timeLineAction.start.bind(timeLineAction);
        videoStartPositions.push(startMethod);

        let end = timeLineAction.duration.end;
        if ((!end) || (isNaN(end))) {
            end = timeLineAction.duration.end = Infinity;
        }
        if (isFinite(end)) {
            const videoEndPositions = this.initializeVideoPosition(this._timeLineActionsLookup[url], end);
            const endMethod = timeLineAction.end.bind(timeLineAction);
            videoEndPositions.push(endMethod);
        }
    }

    initializeUrlLookup(lookup, url) {
        if (!lookup[url]) {
            lookup[url] = {};
        }
        return lookup[url];
    }

    initializeVideoPosition(lookup, position) {
        if (!lookup[position]) {
            lookup[position] = [];
        }
        return lookup[position];
    }

    executeActions(actions, methodName, idx=0) {
        if (idx < actions.length) {
            const action = actions[idx];

            const promise = action[methodName]();
            return promise.then(() => {
                return this.executeActions(actions, methodName, ++idx);
            });
        }
        return new Promise((resolve) => {
            resolve();
        });
    }

    handleRequestEngineRoot(engineRootSelector, resultCallback) {
        resultCallback($(engineRootSelector));
    }

    handleRequestVideoUrl(index, position, previousVideoPosition) {
        position = (position) ? position : 0;
        previousVideoPosition = (previousVideoPosition) ? previousVideoPosition : 0;
        this.timelineProvider.stop();
        this.cleanUpVideoTimeline().then(() => {
            const vidConfig = this.configuration.videourls[index];
            this._currentVideoUrl = vidConfig.url;
            this.timelineProvider.loop = vidConfig.loop;
            if ((!this.timelineProvider.loop) && (position > 0)) {
                this.timelineProvider.once("firstFrame", () => {
                    this.timelineProvider.pause();
                    this.eventbus.broadcastForTopic("videoplayer-duration", this.timelineProvider.playerid, [this.getDuration()]);
                    this.executeStartActions().then(() => {
                        this.timelineProvider.seek(position);
                        this.onSeekHandler(Math.floor, { offset: position });
                    });
                });
            }
            this.timelineProvider.playlistItem(index);
        });
    }

    cleanUpVideoTimeline() {
        return this.executeRelevantActions(this.getActiveActionsForCleanup, "end");
    }

    executeStartActions() {
        return this.executeRelevantActions(this.getNewActions.bind(this, 0), "start");
    }

    getNewActions(position, allActions) {
        return allActions.filter((action) => {
            return (!action.active) && ((action.duration.start <= position) && (action.duration.end >= position));
        });
    }

    getActiveActionsForCleanup(allActions) {
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

    executeRelevantActions(filter, executionType) {
        const timelineActions = this.getRelevantTimelineActions();
        const currentActions = filter.apply(this, [timelineActions]);
        const idx = 0;
        return this.executeActions(currentActions, executionType, idx);
    }

    handleRequestVideoPosition(resultCallback) {
        resultCallback(Math.floor(this.timelineProvider.getPosition()));
    }

    handleVideoComplete() {
        this.cleanUpVideoTimeline();
    }

    handleExecuteTimelineAction(url, index, start) {
        const actions = this.getTimelineActionsForUrl(url);
        const action = (actions) ? actions[index] : null;
        if (action) {
            if (start) {
                action.start();
            } else {
                action.end();
            }
        }
    }

    resizeTimelineAction(url, index) {
        const actions = this.getTimelineActionsForUrl(url);
        const action = (actions) ? actions[index] : null;
        if (action) {
            action.resize();
        }
    }

    getRelevantTimelineActions() {
        return this.getTimelineActionsForUrl(this._currentVideoUrl);
    }

    getTimelineActionsForUrl(url) {
        let timelineActions;
        this.configuration.videourls.some((urlInfo) => {
            if (urlInfo.url === url) {
                timelineActions = urlInfo.timelineActions;
                return true;
            }
            return false;
        });
        return timelineActions;
    }

    onTimeHandler(floor, event) {
        if (!isNaN(event.position)) {
            const pos = floor(event.position);
            if (this._lastPosition !== pos) {
                this.executeActionsForPosition(pos);
                this.eventbus.broadcastForTopic("videoplayer-seconds-update", this.timelineProvider.playerid, [pos, this.timelineProvider.getDuration()]);
            }
            this.eventbus.broadcastForTopic("videoplayer-position-update", this.timelineProvider.playerid, [event.position, this.timelineProvider.getDuration()]);
        }
    }

    onSeekHandler(floor, event) {
        const pos = floor(event.offset);
        if (isNaN(pos)) {
            return;
        }
        this.executeSeekActions(pos).then(() => {
            this.timelineProvider.play();
        });
    }

    executeActionsForPosition(position) {
        this._lastPosition = position;
        const actions = this._timeLineActionsLookup[this._currentVideoUrl];
        if (actions) {
            const executions = actions[position];
            if (executions) {
                executions.forEach((exec) => {
                    exec();
                });
            }
        }
    }

    executeSeekActions(pos) {
        const timelineActions = this.getRelevantTimelineActions();
        const currentActions = this.getActiveActionsForCleanup(timelineActions);

        const newActions = this.getNewActions(pos, timelineActions);

        const idx = 0;
        const promise = this.executeActions(currentActions, "end", idx);
        return new Promise((resolve) => {
            promise.then(() => {
                let idx = 0;
                this.executeActions(newActions, "start", idx).then(() => {
                    resolve();
                });
            });
        });
    }
}

export default ChronoTriggerEngine;
