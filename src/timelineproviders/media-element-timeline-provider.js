import css_mediaelement from '../../node_modules/mediaelement/build/mediaelementplayer.min.css';

import TimelineEventNames from '../timeline-event-names';
import 'mediaelement';
import $ from 'jquery';
import { v4 as uuidv4 } from 'uuid';

const { MediaElementPlayer } = global;

class MediaElementTimelineProvider {
  constructor(eventbus, config) {
    this._videoElementId = uuidv4();
    this.eventbus = eventbus;
    this.config = config;
    this.loop = false;
    this._eventbusListeners = [];
    this.playlist = [];
    this.length = 0;
    this._addEventListeners();
  }

  _addEventListeners() {
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.PLAY_REQUEST, this.play.bind(this)));
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.STOP_REQUEST, this.stop.bind(this)));
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.PAUSE_REQUEST, this.pause.bind(this)));
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.SEEK_REQUEST, this.seek.bind(this)));
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.RESIZE_REQUEST, this.resize.bind(this)));
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.CONTAINER_REQUEST, this._container.bind(this)));
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.DURATION_REQUEST, this.duration.bind(this)));
  }

  _extractUrls(configuration) {
    const urls = configuration.timelines
      .filter((timeline) => timeline.type === 'video')
      .map((timeline) => timeline.uri);
    return urls;
  }

  init(selector) {
    const urls = this._extractUrls(this.config);
    this._addVideoElements(selector, urls);
    const self = this;
    const promise = new Promise((resolve) => {
      const videoElement = document.getElementById(this._videoElementId);
      self.player = new MediaElementPlayer(videoElement, {
        success: (mediaElement, originalNode, instance) => {
          mediaElement.addEventListener('timeupdate', this.timeUpdateHandler.bind(this));
          instance.loop = this.loop;
          console.dir(mediaElement);
          console.dir(originalNode);
          console.dir(instance);
          resolve();
        },
      });
    });
    return promise;
  }

  timeUpdateHandler() {
    console.log(this.player.currentTime);
    this.eventbus.broadcast(TimelineEventNames.TIME, [{ position: this.player.currentTime }]);
    this.eventbus.broadcast(TimelineEventNames.POSITION_UPDATE, [
      { position: this.player.currentTime, duration: this.player.duration },
    ]);
  }

  _addVideoElements(selector, urls) {
    const videoElm = [`<video class='mejs__player' id=${this._videoElementId} data-mejsoptions='{"preload": "true"}'>`];
    urls.forEach((url) => {
      videoElm.push(`<source src='${url}' type='${this._extractFileType(url)}'/>`);
    });
    videoElm.push('</video>');
    $(selector).append(videoElm.join(''));
  }

  _extractFileType(url) {
    const lastIdx = url.lastIndexOf('.');
    return `video/${url.substr(lastIdx + 1)}`;
  }

  play() {
    this.player.play();
  }

  stop() {
    this.player.stop();
  }

  destroy() {
    this.stop();
    this.player.destroy();
    $(`#${this._videoElementId}`).remove();
    this._eventbusListeners.forEach((func) => func());
  }

  pause() {}

  seek() {}

  resize() {}

  duration() {}

  getDuration() {
    return this.player.duration;
  }

  getPosition() {
    return this.player.currentTime;
  }

  on(eventName, handler) {
    const remove = this.eventbus.on(eventName, handler);
    this._eventbusListeners.push(remove);
    return remove;
  }

  once(eventName, handler) {
    this.eventbus.once(eventName, handler);
  }

  _container() {}
}

export default MediaElementTimelineProvider;
