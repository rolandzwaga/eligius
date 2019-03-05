import $ from 'jquery';
import TimelineEventNames from './eventnames';

class RequestAnimationFrameProvider {

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
        this.duration = 0;
    }

    _extractDurations(configuration) {
        const durations = configuration.timelines.filter(timeline => timeline.type === "animation").map(timeline => {
            return timeline.duration;
        });
        return durations;

    }

    _addEventListeners() {
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.PLAY_REQUEST, this.play.bind(this), this.playerid));
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.STOP_REQUEST, this.stop.bind(this), this.playerid));
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.PAUSE_REQUEST, this.pause.bind(this), this.playerid));
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.SEEK_REQUEST, this.seek.bind(this), this.playerid));
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.RESIZE_REQUEST, this.resize.bind(this), this.playerid));
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.CONTAINER_REQUEST, this._container.bind(this), this.playerid));
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.DURATION_REQUEST, this.duration.bind(this), this.playerid));
    }

    _update(now) {
        if(!this.last || now - this.last >= 1000) {
            this.last = now;
            this.current++;
            if (this.current > this.duration) {
                if (this.loop) {
                    this.current = 0;
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

    init(selector) {
        this.container = $(`#${selector}`);
        this.playlist = this._extractDurations(this.config);
        this.duration = this.playlist[0];
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
        this._start();
        this.eventbus.broadcastForTopic(TimelineEventNames.PLAY, this.playerid);
    }

    stop(){
        if (this.requestID) {
            cancelAnimationFrame(this.requestID);
            this.requestID =  null;
        }
        this.eventbus.broadcastForTopic(TimelineEventNames.STOP, this.playerid);
    }

    pause() {
        this.stop();
        this.eventbus.broadcastForTopic(TimelineEventNames.PAUSE, this.playerid);
    }

    seek(position) {
        this.eventbus.broadcastForTopic(TimelineEventNames.SEEK, this.playerid);
        this.current = position;
        this.eventbus.broadcastForTopic(TimelineEventNames.SEEKED, this.playerid);
    }
}

export default RequestAnimationFrameProvider;
