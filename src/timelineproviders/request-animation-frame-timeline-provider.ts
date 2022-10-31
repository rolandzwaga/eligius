import $ from 'jquery';
import {
  IResolvedEngineConfiguration,
  IResolvedTimelineConfiguration,
} from '../configuration/types';
import { IEventbus, TEventbusRemover } from '../eventbus/types';
import { TimelineEventNames } from '../timeline-event-names';
import { TResultCallback } from '../types';
import { animationInterval } from '../util/animation-interval';
import { ITimelineProvider } from './types';

type TUpdateMethod = (now: number) => void;
type TPlayState = 'stopped' | 'running' | 'paused';

export class RequestAnimationFrameTimelineProvider
  implements ITimelineProvider
{
  private _currentPosition: number = 0;
  private _updateBound: TUpdateMethod = this._update.bind(this);
  private _eventbusListeners: TEventbusRemover[] = [];
  private _firstFrame = true;
  private _currentPlaylistItem: IResolvedTimelineConfiguration;
  private _tickInterval = 1000;
  private _playlist: IResolvedTimelineConfiguration[];
  private _containerElement: JQuery<HTMLElement> | undefined;
  private _abortController: AbortController | undefined;
  public playState: TPlayState = 'stopped';

  loop: boolean = false;

  constructor(
    private eventbus: IEventbus,
    private config: IResolvedEngineConfiguration
  ) {
    this.eventbus = eventbus;
    this.config = config;
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
    this._firstFrame = true;
  }

  private _addEventListeners() {
    this._eventbusListeners.push(
      this.eventbus.on(
        TimelineEventNames.PLAY_TOGGLE_REQUEST,
        this.toggleplay.bind(this)
      )
    );
    this._eventbusListeners.push(
      this.eventbus.on(TimelineEventNames.PLAY_REQUEST, this.start.bind(this))
    );
    this._eventbusListeners.push(
      this.eventbus.on(TimelineEventNames.STOP_REQUEST, this.stop.bind(this))
    );
    this._eventbusListeners.push(
      this.eventbus.on(TimelineEventNames.PAUSE_REQUEST, this.pause.bind(this))
    );
    this._eventbusListeners.push(
      this.eventbus.on(TimelineEventNames.SEEK_REQUEST, this.seek.bind(this))
    );
    this._eventbusListeners.push(
      this.eventbus.on(
        TimelineEventNames.RESIZE_REQUEST,
        this._resize.bind(this)
      )
    );
    this._eventbusListeners.push(
      this.eventbus.on(
        TimelineEventNames.CONTAINER_REQUEST,
        this._container.bind(this)
      )
    );
    this._eventbusListeners.push(
      this.eventbus.on(
        TimelineEventNames.DURATION_REQUEST,
        this.requestDurationHandler.bind(this)
      )
    );
  }

  private _update(_now: number): void {
    if (this.playState !== 'running') {
      return;
    }

    this._currentPosition++;

    if (this._currentPosition > this._currentPlaylistItem.duration) {
      if (this.loop) {
        this._resetToStartPosition();
        this.eventbus.broadcast(TimelineEventNames.RESTART);
        this._broadCastPosition();
      } else {
        this.stop();
        this.eventbus.broadcast(TimelineEventNames.COMPLETE);
        return;
      }
    }

    this._broadCastPosition();
  }

  private _broadCastPosition() {
    this.eventbus.broadcast(TimelineEventNames.TIME, [
      { position: this._currentPosition },
    ]);
    this.eventbus.broadcast(TimelineEventNames.POSITION_UPDATE, [
      {
        position: this._currentPosition,
        duration: this._currentPlaylistItem.duration,
      },
    ]);
  }

  private _start() {
    if (this.playState === 'running') {
      return;
    }

    this.playState = 'running';
    this._abortController?.abort();
    this._abortController = new AbortController();

    if (this._firstFrame) {
      this._firstFrame = false;
      this.eventbus.broadcast(TimelineEventNames.FIRST_FRAME);
    }
    if (this._currentPosition == 0) {
      this._broadCastPosition();
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

  private _resize() {
    console.error(
      'Not implemented yet, not even sure this needs to be implemented...'
    );
  }

  private _container(callBack: TResultCallback) {
    callBack(this._containerElement);
  }

  private _stopAnimationInterval(resetPosition: boolean = true) {
    this._abortController?.abort();
    this._abortController = undefined;

    if (resetPosition) {
      this._resetToStartPosition();
    }
  }

  init(): Promise<void> {
    this._addEventListeners();
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
    this._eventbusListeners.forEach((func) => func());
    this._containerElement = undefined;
  }

  toggleplay() {
    if (this.playState !== 'running') {
      this.start();
    } else {
      this.pause();
    }
  }

  start() {
    this._start();
    this.eventbus.broadcast(TimelineEventNames.PLAY);
  }

  stop() {
    this._stopAnimationInterval();
    this.playState = 'stopped';
    this.eventbus.broadcast(TimelineEventNames.STOP);
  }

  pause() {
    this._stopAnimationInterval(false);
    this.playState = 'paused';
    this.eventbus.broadcast(TimelineEventNames.PAUSE);
  }

  seek(position: number) {
    if (position < 0 || position > this._currentPlaylistItem.duration) {
      return;
    }

    this.eventbus.broadcast(TimelineEventNames.SEEK, [
      position,
      this._currentPosition,
      this.getDuration(),
    ]);

    this._currentPosition = position;

    this.eventbus.broadcast(TimelineEventNames.SEEKED, [
      this._currentPosition,
      this.getDuration(),
    ]);
    this.eventbus.broadcast(TimelineEventNames.TIME, [
      { position: this.getPosition() },
    ]);
    this.eventbus.broadcast(TimelineEventNames.POSITION_UPDATE, [
      {
        position: this._currentPosition,
        duration: this._currentPlaylistItem.duration,
      },
    ]);
  }

  getPosition() {
    return this._currentPosition;
  }

  getDuration() {
    return this._currentPlaylistItem.duration;
  }

  requestDurationHandler(callBack: TResultCallback) {
    callBack(this._currentPlaylistItem.duration);
  }
}
