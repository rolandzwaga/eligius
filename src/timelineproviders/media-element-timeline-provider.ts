import * as css_mediaelement from '../../node_modules/mediaelement/build/mediaelementplayer.min.css';

import TimelineEventNames from '../timeline-event-names';
import 'mediaelement';
import $ from 'jquery';
import { v4 as uuidv4 } from 'uuid';
import { ITimelineProvider } from './types';
import { IEventbus, TEventHandlerRemover } from '../eventbus/types';
import { IEngineConfiguration, ITimelineConfiguration, TResultCallback } from '../types';

const { MediaElementPlayer } = global as any;

class MediaElementTimelineProvider implements ITimelineProvider {
  #videoElementId: string = uuidv4();
  #eventbusListeners: TEventHandlerRemover[] = [];
  #playlist: ITimelineConfiguration[] = [];
  #length: number = 0;
  #urls: string[] = [];
  player: mediaelementjs.MediaElementPlayer | undefined;

  loop = false;

  constructor(private eventbus: IEventbus, private config: IEngineConfiguration) {
    this._addEventListeners();
  }

  _addEventListeners() {
    this.#eventbusListeners.push(this.eventbus.on(TimelineEventNames.PLAY_REQUEST, this.start.bind(this)));
    this.#eventbusListeners.push(this.eventbus.on(TimelineEventNames.STOP_REQUEST, this.stop.bind(this)));
    this.#eventbusListeners.push(this.eventbus.on(TimelineEventNames.PAUSE_REQUEST, this.pause.bind(this)));
    this.#eventbusListeners.push(this.eventbus.on(TimelineEventNames.SEEK_REQUEST, this.seek.bind(this)));
    this.#eventbusListeners.push(this.eventbus.on(TimelineEventNames.RESIZE_REQUEST, this.resize.bind(this)));
    this.#eventbusListeners.push(this.eventbus.on(TimelineEventNames.CONTAINER_REQUEST, this._container.bind(this)));
    this.#eventbusListeners.push(this.eventbus.on(TimelineEventNames.DURATION_REQUEST, this.duration.bind(this)));
  }

  _extractUrls(configuration: IEngineConfiguration) {
    const urls = configuration.timelines
      .filter((timeline) => timeline.type === 'video')
      .map((timeline) => timeline.uri);
    return urls;
  }

  init() {
    const selector = '';
    this.#urls = this._extractUrls(this.config);
    this._addVideoElements(selector, this.#urls);
    const self = this;
    const promise = new Promise((resolve) => {
      const videoElement = document.getElementById(this.#videoElementId);
      self.player = new MediaElementPlayer(videoElement, {
        success: (mediaElement: any, originalNode: any, instance: mediaelementjs.MediaElementPlayer) => {
          mediaElement.addEventListener('timeupdate', this._timeUpdateHandler.bind(this));
          instance.loop = this.loop;
          instance.controlsAreVisible = false;
          instance.controlsEnabled = false;
          resolve();
        },
      });
    });
    return promise;
  }

  private _timeUpdateHandler() {
    if (this.player) {
      this.eventbus.broadcast(TimelineEventNames.TIME, [{ position: this.player.currentTime }]);
      this.eventbus.broadcast(TimelineEventNames.POSITION_UPDATE, [
        { position: this.player.currentTime, duration: this.player.duration },
      ]);
    }
  }

  private _addVideoElements(selector: string, urls: string[]) {
    const videoElm = [`<video class='mejs__player' id=${this.#videoElementId} data-mejsoptions='{"preload": "true"}'>`];
    urls.forEach((url) => {
      videoElm.push(`<source src='${url}' type='${this._extractFileType(url)}'/>`);
    });
    videoElm.push('</video>');
    $(selector).append(videoElm.join(''));
  }

  _extractFileType(url: string) {
    const lastIdx = url.lastIndexOf('.');
    return `video/${url.substr(lastIdx + 1)}`;
  }

  playlistItem(uri: string) {
    this.player?.setSrc(uri);
  }

  start() {
    this.player?.play();
  }

  stop() {
    this.player?.stop();
  }

  destroy() {
    if (!this.player?.paused) {
      this.player?.pause();
    }

    this.player?.remove();
    $(`#${this.#videoElementId}`).remove();
    this.#eventbusListeners.forEach((func) => func());
  }

  pause() {
    this.player?.pause();
  }

  seek(position: number) {
    this.player?.setCurrentTime(position);
  }

  resize() {}

  duration(resultCallback: TResultCallback) {
    resultCallback(this.getDuration());
  }

  getDuration() {
    return this.player?.duration || -1;
  }

  getPosition() {
    return this.player?.getCurrentTime() || -1;
  }

  _container(resultCallback: TResultCallback) {
    resultCallback($(`#${this.#videoElementId}`));
  }
}

export default MediaElementTimelineProvider;
