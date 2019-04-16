import $ from 'jquery';
import TimelineEventNames from '../timeline-event-names';

class RequestAnimationFrameTimelineProvider {

    constructor(eventbus, config) {
        this.eventbus = eventbus;
        this.config = config;
        this.requestID = null;
        this.last = 0;
        this.current = 0;
        this._updateBound = this._update.bind(this);
        this.loop = false;
        this._eventbusListeners = [];
        this.playerid = `provider${Math.random()*1000}`;
        this._addEventListeners();
        this.playlist = [];
        this.currentPlaylistItem = null;
        this.firstFrame = true;
        this.paused = true;
    }

    _extractPlaylist(configuration) {
        const playlist = configuration.timelines.filter(timeline => timeline.type === "animation").map(timeline => {
            return timeline;
        });
        return playlist;
    }

    playlistItem(index) {
        if (index < 0 || index > this.playlist.length) {
            return;
        }
        this.currentPlaylistItem = this.playlist[index];
        this.firstFrame = true;
        this.reset();
    }

    _addEventListeners() {
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.PLAY_REQUEST, this.play.bind(this), this.playerid));
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.STOP_REQUEST, this.stop.bind(this), this.playerid));
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.PAUSE_REQUEST, this.pause.bind(this), this.playerid));
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.SEEK_REQUEST, this.seek.bind(this), this.playerid));
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.RESIZE_REQUEST, this._resize.bind(this), this.playerid));
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.CONTAINER_REQUEST, this._container.bind(this), this.playerid));
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.DURATION_REQUEST, this.requestDurationHandler.bind(this), this.playerid));
    }

    _update(now) {
        if (!this.paused) {
            return;
        }
        if(!this.last || now - this.last >= 1000) {
            if (!this.last && this.firstFrame) {
                this.firstFrame = false;
                this.eventbus.broadcastForTopic(TimelineEventNames.FIRSTFRAME, this.playerid);
            }
            this.last = now;
            this.current++;
            if (this.current > this.currentPlaylistItem.duration) {
                if (this.loop) {
                    this._reset();
                } else {
                    this.stop();
                    this.eventbus.broadcastForTopic(TimelineEventNames.COMPLETE, this.playerid);
                    return;
                }
            }
            this.eventbus.broadcastForTopic(TimelineEventNames.TIME, this.playerid, this.current);
        }
        this.requestID = requestAnimationFrame(this._updateBound);
    }

    _start() {
        if (this.requestID) {
            return;
        }
        this.requestID = requestAnimationFrame(this._updateBound)
    }

    _reset() {
        this._cancelAnimationFrame();
        this.last = 0;
        this.current = 0;
    }

    _resize() {
        console.error('Not implemented yet');
    }

    _container(callBack) {
        callBack(this.container);
    }

    _cancelAnimationFrame() {
        if (this.requestID) {
            cancelAnimationFrame(this.requestID);
            this.requestID =  null;
        }
    }

    init() {
        this.playlist = this._extractPlaylist(this.config);
        this.currentPlaylistItem = this.playlist[0];
        this.container = $(this.currentPlaylistItem.selector);
        if (!this.container.length) {
            throw new Error(`timeline selector '${selector}' not found`);
        }
        const promise = new Promise((resolve) => {
            resolve();
        });
        return promise;

    }

    destroy() {
        this.stop();
        this._eventbusListeners.forEach(func => {
            func();
        });
    }

    play(){
        this.paused = false;
        this._start();
        this.eventbus.broadcastForTopic(TimelineEventNames.PLAY, this.playerid);
    }

    stop(){
        this._cancelAnimationFrame();
        this.eventbus.broadcastForTopic(TimelineEventNames.STOP, this.playerid);
    }

    pause() {
        this.paused = true;
        this.eventbus.broadcastForTopic(TimelineEventNames.PAUSE, this.playerid);
    }

    seek(position) {
        if (position < 0 || position > this.currentPlaylistItem.duration) {
            return;
        }
        this.eventbus.broadcastForTopic(TimelineEventNames.SEEK, this.playerid);
        this.current = position;
        this.eventbus.broadcastForTopic(TimelineEventNames.SEEKED, this.playerid);
    }

    requestDurationHandler(callBack) {
        callBack(this.currentPlaylistItem.duration);
    }

    on(eventName, handler) {
        return this.eventbus.on(eventName, handler, this.playerid);
    }

    once(eventName, handler) {
        return this.eventbus.once(eventName, handler, this.playerid);
    }
}

export default RequestAnimationFrameTimelineProvider;
