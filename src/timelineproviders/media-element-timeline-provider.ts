import $ from 'jquery';
import 'mediaelement';
import { v4 as uuidv4 } from 'uuid';
import { IResolvedEngineConfiguration, IResolvedTimelineConfiguration } from '~/configuration/types';
import { IEventbus, TEventHandlerRemover } from '~/eventbus/types';
import { TimelineEventNames } from '~/timeline-event-names';
import { TResultCallback } from '~/types';
import { ITimelineProvider } from './types';

const { MediaElementPlayer } = window as any;

export class MediaElementTimelineProvider implements ITimelineProvider {
  private _videoElementId: string = uuidv4();
  private _eventbusListeners: TEventHandlerRemover[] = [];
  private _playlist: IResolvedTimelineConfiguration[] = [];
  private _length: number = 0;
  private _urls: string[] = [];

  player: mediaelementjs.MediaElementPlayer | undefined;

  loop = false;

  constructor(private eventbus: IEventbus, private config: IResolvedEngineConfiguration) {
    this._addEventListeners();
  }

  _addEventListeners() {
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.PLAY_REQUEST, this.start.bind(this)));
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.STOP_REQUEST, this.stop.bind(this)));
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.PAUSE_REQUEST, this.pause.bind(this)));
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.SEEK_REQUEST, this.seek.bind(this)));
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.RESIZE_REQUEST, this.resize.bind(this)));
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.CONTAINER_REQUEST, this._container.bind(this)));
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.DURATION_REQUEST, this.duration.bind(this)));
  }

  _extractUrls(configuration: IResolvedEngineConfiguration) {
    const urls = configuration.timelines
      .filter((timeline) => timeline.type === 'mediaplayer')
      .map((timeline) => timeline.uri);
    return urls;
  }

  init() {
    const selector = '';
    this._urls = this._extractUrls(this.config);
    this._addVideoElements(selector, this._urls);
    const self = this;

    const promise = new Promise((resolve) => {
      const videoElement = document.getElementById(this._videoElementId);
      self.player = new MediaElementPlayer(videoElement, {
        success: (mediaElement: any, _originalNode: any, instance: mediaelementjs.MediaElementPlayer) => {
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
    const videoElm = [`<video class='mejs__player' id=${this._videoElementId} data-mejsoptions='{"preload": "true"}'>`];
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
    $(`#${this._videoElementId}`).remove();
    this._eventbusListeners.forEach((func) => func());
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
    resultCallback($(`#${this._videoElementId}`));
  }
}
