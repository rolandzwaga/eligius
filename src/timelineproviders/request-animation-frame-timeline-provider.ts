import $ from 'jquery';
import TimelineEventNames from '../timeline-event-names';
import { ITimelineProvider } from './types';
import { IEventbus, TEventHandlerRemover } from '../eventbus/types';
import { IEngineConfiguration, ITimelineConfiguration, TResultCallback } from '../types';

type TUpdateMethod = (now: number) => void;
type TPlayState = 'stopped' | 'running' | 'paused';

class RequestAnimationFrameTimelineProvider implements ITimelineProvider {
  #requestID: number = -1;
  #last: number = 0;
  #currentPosition: number = 0;
  #updateBound: TUpdateMethod = this._update.bind(this);
  #eventbusListeners: TEventHandlerRemover[] = [];
  #firstFrame = true;
  #currentPlaylistItem: ITimelineConfiguration;
  #granularity = 1000;
  #playState: TPlayState = 'stopped';
  #playlist: ITimelineConfiguration[];
  #container: JQuery<HTMLElement> | undefined;

  loop: boolean = false;

  constructor(private eventbus: IEventbus, private config: IEngineConfiguration) {
    this.eventbus = eventbus;
    this.config = config;
    this.#playlist = this._extractPlaylist(config);
    this.#currentPlaylistItem = this.#playlist[0];
  }

  private _extractPlaylist(configuration: IEngineConfiguration): ITimelineConfiguration[] {
    const playlist = configuration.timelines.filter((timeline) => timeline.type === 'animation');
    return playlist;
  }

  playlistItem(uri: string): void {
    if (uri === null || !uri.length || this.#playlist.length === 0) {
      return;
    }
    const item = this.#playlist.find((item) => {
      return item.uri === uri;
    });
    if (!item) {
      throw new Error(`Unknown playlist uri: ${uri}`);
    }
    this.#currentPlaylistItem = item;
    this.#firstFrame = true;
  }

  private _addEventListeners() {
    this.#eventbusListeners.push(this.eventbus.on(TimelineEventNames.PLAY_TOGGLE_REQUEST, this.toggleplay.bind(this)));
    this.#eventbusListeners.push(this.eventbus.on(TimelineEventNames.PLAY_REQUEST, this.play.bind(this)));
    this.#eventbusListeners.push(this.eventbus.on(TimelineEventNames.STOP_REQUEST, this.stop.bind(this)));
    this.#eventbusListeners.push(this.eventbus.on(TimelineEventNames.PAUSE_REQUEST, this.pause.bind(this)));
    this.#eventbusListeners.push(this.eventbus.on(TimelineEventNames.SEEK_REQUEST, this.seek.bind(this)));
    this.#eventbusListeners.push(this.eventbus.on(TimelineEventNames.RESIZE_REQUEST, this._resize.bind(this)));
    this.#eventbusListeners.push(this.eventbus.on(TimelineEventNames.CONTAINER_REQUEST, this._container.bind(this)));
    this.#eventbusListeners.push(
      this.eventbus.on(TimelineEventNames.DURATION_REQUEST, this.requestDurationHandler.bind(this))
    );
  }

  private _update(now: number): void {
    if (this.#playState !== 'running') {
      return;
    }
    if (!this.#last || now - this.#last >= this.#granularity) {
      if (!this.#last && this.#firstFrame) {
        this.#firstFrame = false;
        this.eventbus.broadcast(TimelineEventNames.FIRSTFRAME);
      }
      this.#last = now;
      this.#currentPosition++;
      if (this.#currentPosition > this.#currentPlaylistItem.duration) {
        if (this.loop) {
          this._reset();
        } else {
          this.stop();
          this.eventbus.broadcast(TimelineEventNames.COMPLETE);
          return;
        }
      }
      this.eventbus.broadcast(TimelineEventNames.TIME, [{ position: this.#currentPosition }]);
      this.eventbus.broadcast(TimelineEventNames.POSITION_UPDATE, [
        { position: this.#currentPosition, duration: this.#currentPlaylistItem.duration },
      ]);
    }
    this.#requestID = requestAnimationFrame(this.#updateBound);
  }

  private _start() {
    if (this.#requestID && this.#playState === 'running') {
      return;
    }
    this.#playState = 'running';
    this.#requestID = requestAnimationFrame(this.#updateBound);
  }

  private _reset() {
    this._cancelAnimationFrame();
    this.#last = 0;
    this.#currentPosition = 0;
  }

  private _resize() {
    console.error('Not implemented yet');
  }

  private _container(callBack: TResultCallback) {
    callBack(this.#container);
  }

  private _cancelAnimationFrame() {
    if (this.#requestID) {
      cancelAnimationFrame(this.#requestID);
      this.#requestID = -1;
      this.#last = 0;
      this.#currentPosition = 0;
    }
  }

  init(): Promise<any> {
    this._addEventListeners();
    this.#currentPlaylistItem = this.#playlist[0];
    this.#container = $(this.#currentPlaylistItem.selector);
    if (!this.#container.length) {
      throw new Error(`timeline selector '${this.#currentPlaylistItem.selector}' not found`);
    }
    const promise = new Promise((resolve) => {
      resolve();
    });
    return promise;
  }

  destroy() {
    this.stop();
    this.#eventbusListeners.forEach((func) => func());
    this.#container = undefined;
  }

  toggleplay() {
    if (this.#playState !== 'running') {
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
    this._cancelAnimationFrame();
    this.#playState = 'stopped';
    this.eventbus.broadcast(TimelineEventNames.STOP);
  }

  pause() {
    this.#playState = 'paused';
    this.eventbus.broadcast(TimelineEventNames.PAUSE);
  }

  seek(position: number) {
    if (position < 0 || position > this.#currentPlaylistItem.duration) {
      return;
    }
    this.eventbus.broadcast(TimelineEventNames.SEEK, [position, this.#currentPosition, this.getDuration()]);
    this.#currentPosition = position;
    this.eventbus.broadcast(TimelineEventNames.SEEKED, [this.getPosition(), this.getDuration()]);
    this.eventbus.broadcast(TimelineEventNames.TIME, [{ position: this.getPosition() }]);
    this.eventbus.broadcast(TimelineEventNames.POSITION_UPDATE, [
      { position: this.#currentPosition, duration: this.#currentPlaylistItem.duration },
    ]);
  }

  getPosition() {
    return this.#currentPosition;
  }

  getDuration() {
    return this.#currentPlaylistItem.duration;
  }

  requestDurationHandler(callBack: TResultCallback) {
    callBack(this.#currentPlaylistItem.duration);
  }
}

export default RequestAnimationFrameTimelineProvider;
