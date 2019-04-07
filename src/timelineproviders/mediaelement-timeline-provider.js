import TimelineEventNames from '../timeline-event-names';
import MediaElementPlayer from 'mediaelement';

class MediaElementTimelineProvider {

    constructor(eventbus, config) {
        this.eventbus = eventbus;
        this.config = config;
        this.loop = false;
        this._eventbusListeners = [];
        this.playerid = `provider${Math.random()*1000}`;
        this._addEventListeners();
        this.playlist = [];
        this.duration = 0;
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

    _extractUrls(configuration) {
        const urls = configuration.timelines.filter(timeline => timeline.type === "video").map(timeline => {
            return timeline.url;
        });
        return urls;
    }

    init(selector) {
        const urls = this._extractUrls(this.config);
        this.player = new MediaElementPlayer(document.querySelector(selector), {
            success: (mediaElement, originalNode, instance) => { }
        });
    }

    play() {

    }

    stop() {

    }

    pause() {

    }

    seek() {

    }

    resize() {

    }

    _container() {

    }

    duration() {

    }
}

export default MediaElementTimelineProvider;
