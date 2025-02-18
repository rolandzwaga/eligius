import $ from 'jquery';
import { v4 as uuidv4 } from 'uuid';
import videojs from 'video.js';
import Player, { type PlayerReadyCallback } from 'video.js/dist/types/player.ts';
import type { IResolvedEngineConfiguration } from '../configuration/types.ts';
import type { ITimelineProvider, TPlayState } from './types.ts';

export class VideoJsTimelineProvider implements ITimelineProvider {
  private _videoElementId: string = uuidv4();
  private _eventHandlers: (() => void)[] = [];

  private _playState: TPlayState = 'stopped';
  public get playState(): TPlayState {
    return this._playState;
  }
  loop = false;
  private _urls: string[] = [];
  private _onTime: ((position: number) => void) | undefined;
  private _onComplete: (() => void) | undefined;
  private _onRestart: (() => void) | undefined;
  private _onFirstFrame: (() => void) | undefined;
  private _player: typeof Player | undefined;

  constructor(private config: IResolvedEngineConfiguration) {}

  init(): Promise<void> {
    videojs.log.level('all');

    const selector =
      this.config.timelineProviderSettings.mediaplayer?.selector ?? '';
    this._urls = this._extractUrls(this.config);
    this._addVideoElements(selector, this._urls);

    const self = this;

    const promise = new Promise<void>((resolve) => {
    
      setTimeout(() => {
        this._player = videojs(this._videoElementId, {
          controls: false,
          controlBar: false,
          liveui: false,
          autoplay: false,
          preload: 'auto',
          loop: this.loop,
          src: this._urls[0],
        }, function onPlayerReady(this: any) {
          this.one('firstplay', () => self._onFirstFrame?.());
          this.one('canplay', () => resolve());
          self._addPlayerListener(this, 'ended', self._handleEnded.bind(self));
          self._addPlayerListener(this,
            'timeupdate',
            self._handleTimeUpdate.bind(self)
          );
          this.load();
        } as PlayerReadyCallback);

      }, 0);
    });

    return promise;
  }

  private _addPlayerListener(
    instance: any,
    type: string,
    eventHandler: (...args: any[]) => void
  ) {
    instance.on(type, eventHandler);
    this._eventHandlers.push(() => instance.off(type, eventHandler));
  }

  private _handleEnded() {
    if (!this._player?.loop) {
      this._onComplete?.();
    } else {
      this._onRestart?.();
    }
  }

  private _handleTimeUpdate() {
    if (this._player) {
      const time = this._player.currentTime();
      if (time !== undefined) {
        this._onTime?.(time);
      }
    }
  }

  start(): void {
    this._player?.play();
  }

  stop(): void {
    this._player?.pause();
    this._player?.currentTime(0);
  }

  pause(): void {
    this._player?.pause();
  }

  seek(position: number): Promise<number> {
    return new Promise<number>((resolve) => {
      (this._player as any).one('seeked', () => {
        resolve(this._player?.currentTime() ?? 0);
      });
      this._player?.currentTime(position);
    });
  }

  playlistItem(uri: string): void {
    if (this._urls.includes(uri)) {
      this._player?.selectSource([uri]);
    }
  }

  getPosition(): number {
    return this._player?.currentTime() ?? 0;
  }

  getDuration(): number {
    return this._player?.duration() ?? 0;
  }

  getContainer(): JQuery<HTMLElement> | undefined {
    const selector =
      this.config.timelineProviderSettings.mediaplayer?.selector ?? '';
    return $(selector);
  }

  destroy(): void {
    this._eventHandlers.forEach((remover) => remover());
    this._eventHandlers.length = 0;
  }

  onTime(callback: (position: number) => void): void {
    this._onTime = callback;
  }

  onComplete(callback: () => void): void {
    this._onComplete = callback;
  }

  onRestart(callback: () => void): void {
    this._onRestart = callback;
  }

  onFirstFrame(callback: () => void): void {
    this._onFirstFrame = callback;
  }

  private _extractUrls(configuration: IResolvedEngineConfiguration) {
    const urls = configuration.timelines
      .filter((timeline) => timeline.type === 'mediaplayer')
      .map((timeline) => timeline.uri);
    return urls;
  }

  private _addVideoElements(selector: string, urls: string[]) {
    const videoElm = [`<video id=${this._videoElementId}>`];
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
    return `video/${url.substring(lastIdx + 1)}`;
  }
}
