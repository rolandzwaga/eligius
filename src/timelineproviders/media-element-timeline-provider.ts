import $ from 'jquery';
import 'mediaelement';
import { v4 as uuidv4 } from 'uuid';
import {
  IResolvedEngineConfiguration,
  IResolvedTimelineConfiguration,
} from '../configuration/types';
import { ITimelineProvider, TPlayState } from './types';

const { MediaElementPlayer } = window as any;

export class MediaElementTimelineProvider implements ITimelineProvider {
  private _videoElementId: string = uuidv4();
  private _firstFramePending = true;
  private _playlist: IResolvedTimelineConfiguration[] = [];
  private _length: number = 0;
  private _urls: string[] = [];
  private _onTime: ((position: number) => void) | undefined;
  private _onComplete: (() => void) | undefined;
  private _onRestart: (() => void) | undefined;
  private _onFirstFrame: (() => void) | undefined;
  private _player: mediaelementjs.MediaElementPlayer | undefined;
  loop = false;

  private _playState: TPlayState = 'stopped';
  public get playState(): TPlayState {
    return this._playState;
  }

  constructor(private config: IResolvedEngineConfiguration) {}

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

    const promise = new Promise<void>((resolve) => {
      const videoElement = document.getElementById(this._videoElementId);
      if (!videoElement) {
        throw new Error(`Element with id '${this._videoElementId}' not found`);
      }
      self._player = new MediaElementPlayer(videoElement, {
        stretching: 'responsive',
        success: (
          mediaElement: any,
          _originalNode: any,
          instance: mediaelementjs.MediaElementPlayer
        ) => {
          mediaElement.addEventListener(
            'timeupdate',
            this._timeUpdateHandler.bind(this)
          );
          mediaElement.addEventListener(
            'playing',
            this._playingHandler.bind(this)
          );
          mediaElement.addEventListener('ended', this._endedHandler.bind(this));
          mediaElement.addEventListener('pause', this._pauseHandler.bind(this));
          instance.controls = false;
          instance.loop = this.loop;
          instance.controlsAreVisible = false;
          instance.controlsEnabled = false;
          resolve();
        },
      });
    });

    return promise;
  }

  private _endedHandler() {
    if (this.loop) {
      this._onRestart?.();
    } else {
      this._onComplete?.();
    }
  }

  private _playingHandler() {
    this._playState = 'running';
  }

  private _pauseHandler() {
    this._playState = 'stopped';
  }

  onTime(callback: (position: number) => void) {
    this._onTime = callback;
  }

  onComplete(callback: () => void) {
    this._onComplete = callback;
  }

  onRestart(callback: () => void) {
    this._onRestart = callback;
  }

  onFirstFrame(callback: () => void) {
    this._onFirstFrame = callback;
  }

  private _timeUpdateHandler() {
    if (this._firstFramePending) {
      this._firstFramePending = false;
      this._onFirstFrame?.();
    }
    this._onTime?.(this._player?.currentTime ?? 0);
  }

  private _addVideoElements(selector: string, urls: string[]) {
    const videoElm = [
      `<video class='mejs__player' id=${this._videoElementId} data-mejsoptions='{"preload": "true"}'>`,
    ];
    urls.forEach((url) => {
      videoElm.push(
        `<source src='${url}' type='${this._extractFileType(url)}'/>`
      );
    });
    videoElm.push('</video>');
    $(selector).append(videoElm.join(''));
  }

  _extractFileType(url: string) {
    const lastIdx = url.lastIndexOf('.');
    return `video/${url.substr(lastIdx + 1)}`;
  }

  playlistItem(uri: string) {
    this._player?.setSrc(uri);
  }

  start() {
    if (this._player?.currentTime === 0) {
      this._onTime?.(0);
    }
    if (this._player?.paused) {
      this._player?.play();
    }
  }

  stop() {
    this._player?.stop();
  }

  destroy() {
    if (!this._player?.paused) {
      this._player?.pause();
    }

    this._player?.remove();
    $(`#${this._videoElementId}`).remove();
  }

  pause() {
    this._player?.pause();
  }

  async seek(position: number) {
    return new Promise<number>((resolve: (value: number) => void) => {
      const handler = () => {
        this._player?.removeEventListener('seeked', handler);
        resolve(this._player?.getCurrentTime() ?? 0);
      };
      this._player?.addEventListener('seeked', handler);
      this._player?.setCurrentTime(position);
    });
  }

  getDuration() {
    return this._player?.duration ?? -1;
  }

  getPosition() {
    return this._player?.getCurrentTime() ?? -1;
  }

  getContainer(): JQuery<HTMLElement> | undefined {
    return $(`#${this._videoElementId}`);
  }
}
