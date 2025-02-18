import $ from 'jquery';
import type {
  IResolvedEngineConfiguration,
  IResolvedTimelineConfiguration,
} from '../configuration/types.ts';
import { animationInterval } from '../util/animation-interval.ts';
import type { ITimelineProvider, TPlayState } from './types.ts';

type TUpdateMethod = (now: number) => void;

export class RequestAnimationFrameTimelineProvider
  implements ITimelineProvider
{
  private _currentPosition: number = 0;
  private _updateBound: TUpdateMethod = this._update.bind(this);
  private _firstFramePending = true;
  private _currentPlaylistItem: IResolvedTimelineConfiguration;
  private _tickInterval = 1000;
  private _playlist: IResolvedTimelineConfiguration[];
  private _containerElement: JQuery<HTMLElement> | undefined;
  private _abortController: AbortController | undefined;
  private _onTime: ((position: number) => void) | undefined;
  private _onComplete: (() => void) | undefined;
  private _onRestart: (() => void) | undefined;
  private _onFirstFrame: (() => void) | undefined;
  loop: boolean = false;

  private _playState: TPlayState = 'stopped';
  public get playState(): TPlayState {
    return this._playState;
  }

  constructor(config: IResolvedEngineConfiguration) {
    this._playlist = this._extractPlaylist(config);
    this._currentPlaylistItem = this._playlist[0];
  }

  private _extractPlaylist(
    configuration: IResolvedEngineConfiguration
  ): IResolvedTimelineConfiguration[] {
    const playlist = configuration.timelines.filter(
      (timeline) => timeline.type === 'animation'
    );
    return playlist;
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

  playlistItem(uri: string): void {
    if (uri === null || !uri.length || this._playlist.length === 0) {
      return;
    }

    const item = this._playlist.find((item) => {
      return item.uri === uri;
    });

    if (!item) {
      throw new Error(`Unknown playlist uri: ${uri}`);
    }

    this._currentPlaylistItem = item;
  }

  private _update(_now: number): void {
    if (this.playState !== 'running') {
      return;
    }

    this._currentPosition++;

    if (this._currentPosition > this._currentPlaylistItem.duration) {
      if (this.loop) {
        this._resetToStartPosition();
        this._onRestart?.();
        this._callbackPosition();
      } else {
        this.stop();
        this._onComplete?.();
        return;
      }
    }

    this._callbackPosition();
  }

  private _callbackPosition() {
    this._onTime?.(this._currentPosition);
  }

  start() {
    if (this.playState === 'running') {
      if (this._currentPosition == 0) {
        this._callbackPosition();
      }
      return;
    }

    this._playState = 'running';
    this._abortController?.abort();
    this._abortController = new AbortController();

    if (this._firstFramePending) {
      this._firstFramePending = false;
      this._onFirstFrame?.();
    }
    if (this._currentPosition == 0) {
      this._callbackPosition();
    }

    animationInterval(
      this._tickInterval,
      this._abortController.signal,
      this._updateBound
    );
  }

  private _resetToStartPosition() {
    this._currentPosition = 0;
  }

  getContainer() {
    return this._containerElement;
  }

  private _stopAnimationInterval(resetPosition: boolean = true) {
    this._abortController?.abort();
    this._abortController = undefined;

    if (resetPosition) {
      this._resetToStartPosition();
    }
  }

  init(): Promise<void> {
    this._currentPlaylistItem = this._playlist[0];
    this._containerElement = $(this._currentPlaylistItem.selector);

    if (!this._containerElement.length) {
      throw new Error(
        `timeline selector '${this._currentPlaylistItem.selector}' not found`
      );
    }

    return Promise.resolve();
  }

  destroy() {
    this.stop();
    this._containerElement = undefined;
  }

  stop() {
    this._stopAnimationInterval();
    this._playState = 'stopped';
  }

  pause() {
    this._stopAnimationInterval(false);
    this._playState = 'stopped';
  }

  seek(position: number) {
    if (position < 0 || position > this._currentPlaylistItem.duration) {
      return Promise.resolve(this._currentPosition);
    }
    this._currentPosition = position;
    return Promise.resolve(position);
  }

  getPosition() {
    return this._currentPosition;
  }

  getDuration() {
    return this._currentPlaylistItem.duration;
  }
}
