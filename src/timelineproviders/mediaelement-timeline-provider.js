import TimelineEventNames from '../timeline-event-names';
import MediaElement from 'mediaelement';
import $ from 'jquery';

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
        this._addVideoElements(selector, urls);
        this.player = new MediaElement(document.querySelector('.mejs__player'), {
            success: (mediaElement, originalNode, instance) => { }
        });
    }

    _addVideoElements(selector, urls) {
        const videoElm = ['<video class=\'mejs__player\'>'];
        urls.forEach(url => {
            videoElm.push(`<source src='${url}' type='${this._extractFileType(url)}'/>`);
        });
        videoElm.push('</video>');
        $(selector).append(videoElm.join(''));
    }

    _extractFileType(url) {
        const lastIdx = url.lastIndexOf('.');
        return `video/${url.substr(lastIdx+1)}`;
    }

    play() {
        this.player.play();
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
