import $ from 'jquery';
import TimelineEventNames from '../timeline-event-names';

class RequestAnimationFrameTimelineProvider {
  constructor(eventbus, config) {
    this.eventbus = eventbus;
    this.config = config;
    this.requestID = null;
    this.last = 0;
    this.current = 0;
    this._updateBound = this._update.bind(this);
    this.loop = false;
    this._eventbusListeners = [];
    this.playlist = [];
    this.currentPlaylistItem = null;
    this.firstFrame = true;
    this.playState = 'stopped';
    this.granularity = 1000;
    this.playlist = this._extractPlaylist(config);
  }

  _extractPlaylist(configuration) {
    const playlist = configuration.timelines.filter(timeline => timeline.type === 'animation');
    return playlist;
  }

  playlistItem(uri) {
    if (uri === null || !uri.length || this.playlist.length === 0) {
      return;
    }
    this.currentPlaylistItem = this.playlist.find(item => {
      return item.uri === uri;
    });
    this.firstFrame = true;
  }

  _addEventListeners() {
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.PLAY_TOGGLE_REQUEST, this.toggleplay.bind(this)));
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.PLAY_REQUEST, this.play.bind(this)));
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.STOP_REQUEST, this.stop.bind(this)));
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.PAUSE_REQUEST, this.pause.bind(this)));
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.SEEK_REQUEST, this.seek.bind(this)));
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.RESIZE_REQUEST, this._resize.bind(this)));
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.CONTAINER_REQUEST, this._container.bind(this)));
    this._eventbusListeners.push(
      this.eventbus.on(TimelineEventNames.DURATION_REQUEST, this.requestDurationHandler.bind(this))
    );
    this._eventbusListeners.push(
      this.eventbus.on(TimelineEventNames.PROVIDERID_REQUEST, this.requestProviderIdHandler.bind(this))
    );
  }

  _update(now) {
    if (this.playState !== 'running') {
      return;
    }
    if (!this.last || now - this.last >= this.granularity) {
      if (!this.last && this.firstFrame) {
        this.firstFrame = false;
        this.eventbus.broadcast(TimelineEventNames.FIRSTFRAME);
      }
      this.last = now;
      this.current++;
      if (this.current > this.currentPlaylistItem.duration) {
        if (this.loop) {
          this._reset();
        } else {
          this.stop();
          this.eventbus.broadcast(TimelineEventNames.COMPLETE);
          return;
        }
      }
      this.eventbus.broadcast(TimelineEventNames.TIME, [{ position: this.current }]);
      this.eventbus.broadcast(TimelineEventNames.POSITION_UPDATE, [
        { position: this.current, duration: this.currentPlaylistItem.duration },
      ]);
    }
    this.requestID = requestAnimationFrame(this._updateBound);
  }

  _start() {
    if (this.requestID && this.playState === 'running') {
      return;
    }
    this.playState = 'running';
    this.requestID = requestAnimationFrame(this._updateBound);
  }

  _reset() {
    this._cancelAnimationFrame();
    this.last = 0;
    this.current = 0;
  }

  _resize() {
    console.error('Not implemented yet');
  }

  _container(callBack) {
    callBack(this.container);
  }

  _cancelAnimationFrame() {
    if (this.requestID) {
      cancelAnimationFrame(this.requestID);
      this.requestID = null;
      this.last = 0;
      this.current = 0;
    }
  }

  init() {
    this._addEventListeners();
    this.currentPlaylistItem = this.playlist[0];
    this.container = $(this.currentPlaylistItem.selector);
    if (!this.container.length) {
      throw new Error(`timeline selector '${this.currentPlaylistItem.selector}' not found`);
    }
    const promise = new Promise(resolve => {
      resolve();
    });
    return promise;
  }

  destroy() {
    this.stop();
    this._eventbusListeners.forEach(func => func());
    this.container = null;
    this.currentPlaylistItem = null;
  }

  toggleplay() {
    if (this.playState !== 'running') {
      this.play();
    } else {
      this.pause();
    }
  }

  play() {
    this._start();
    this.eventbus.broadcast(TimelineEventNames.PLAY);
  }

  stop() {
    this._cancelAnimationFrame();
    this.playState = 'stopped';
    this.eventbus.broadcast(TimelineEventNames.STOP);
  }

  pause() {
    this.playState = 'paused';
    this.eventbus.broadcast(TimelineEventNames.PAUSE);
  }

  seek(position) {
    if (position < 0 || position > this.currentPlaylistItem.duration) {
      return;
    }
    this.eventbus.broadcast(TimelineEventNames.SEEK, [position, this.current, this.getDuration()]);
    this.current = position;
    this.eventbus.broadcast(TimelineEventNames.SEEKED, [this.getPosition(), this.getDuration()]);
  }

  getPosition() {
    return this.current;
  }

  getDuration() {
    return this.currentPlaylistItem.duration;
  }

  requestDurationHandler(callBack) {
    callBack(this.currentPlaylistItem.duration);
  }

  requestProviderIdHandler(callBack) {
    callBack(this.providerid);
  }

  on(eventName, handler) {
    return this.eventbus.on(eventName, handler);
  }

  once(eventName, handler) {
    return this.eventbus.once(eventName, handler);
  }
}

export default RequestAnimationFrameTimelineProvider;
