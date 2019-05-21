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
        this.providerid = `provider${Math.random()*1000}`;
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
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.PLAY_TOGGLE_REQUEST, this.toggleplay.bind(this), this.providerid));
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.PLAY_REQUEST, this.play.bind(this), this.providerid));
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.STOP_REQUEST, this.stop.bind(this), this.providerid));
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.PAUSE_REQUEST, this.pause.bind(this), this.providerid));
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.SEEK_REQUEST, this.seek.bind(this), this.providerid));
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.RESIZE_REQUEST, this._resize.bind(this), this.providerid));
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.CONTAINER_REQUEST, this._container.bind(this), this.providerid));
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.DURATION_REQUEST, this.requestDurationHandler.bind(this), this.providerid));
        this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.PROVIDERID_REQUEST, this.requestProviderIdHandler.bind(this)));
    }

    _update(now) {
        if (this.paused) {
            return;
        }
        if(!this.last || now - this.last >= 1000) {
            if (!this.last && this.firstFrame) {
                this.firstFrame = false;
                this.eventbus.broadcastForTopic(TimelineEventNames.FIRSTFRAME, this.providerid);
            }
            this.last = now;
            this.current++;
            if (this.current > this.currentPlaylistItem.duration) {
                if (this.loop) {
                    this._reset();
                } else {
                    this.stop();
                    this.eventbus.broadcastForTopic(TimelineEventNames.COMPLETE, this.providerid);
                    return;
                }
            }
            this.eventbus.broadcastForTopic(TimelineEventNames.TIME, this.providerid, [{position: this.current}]);
            this.eventbus.broadcastForTopic(TimelineEventNames.POSITION_UPDATE, this.providerid, [{position: this.current, duration: this.currentPlaylistItem.duration}]);
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
        this._eventbusListeners.forEach(func => func());
    }

    toggleplay() {
        if (this.paused) {
            this.play();
        } else {
            this.pause();
        }
    }

    play(){
        this.paused = false;
        this._start();
        this.eventbus.broadcastForTopic(TimelineEventNames.PLAY, this.providerid);
    }

    stop() {
        this.paused = false;
        this._cancelAnimationFrame();
        this.eventbus.broadcastForTopic(TimelineEventNames.STOP, this.providerid);
    }

    pause() {
        this.paused = true;
        this.eventbus.broadcastForTopic(TimelineEventNames.PAUSE, this.providerid);
    }

    seek(position) {
        if (position < 0 || position > this.currentPlaylistItem.duration) {
            return;
        }
        this.eventbus.broadcastForTopic(TimelineEventNames.SEEK, this.providerid);
        this.current = position;
        this.eventbus.broadcastForTopic(TimelineEventNames.SEEKED, this.providerid);
    }

    getPosition() {
        return this.current;
    }

    getDuration() {
        return this.currentPlaylistItem.duration;
    }

    requestDurationHandler(callBack) {
        callBack(this.currentPlaylistItem.duration);
    }

    requestProviderIdHandler(callBack) {
        callBack(this.providerid);
    }

    on(eventName, handler) {
        return this.eventbus.on(eventName, handler, this.providerid);
    }

    once(eventName, handler) {
        return this.eventbus.once(eventName, handler, this.providerid);
    }
}

export default RequestAnimationFrameTimelineProvider;
