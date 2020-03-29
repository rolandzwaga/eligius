import $ from 'jquery';
import TimelineEventNames from '../timeline-event-names';

class JwPlayerTimelineProvider {
  constructor(eventbus, config) {
    this.eventbus = eventbus;
    this.config = config;
    this.loop = false;
    this.player = null;
    this.currentLoopHandler = null;
    this._eventbusListeners = [];
    this._addEventListeners();
  }

  _extractUrls(configuration) {
    const urls = configuration.timelines
      .filter(timeline => timeline.type === 'video')
      .map(timeline => {
        return timeline.uri;
      });
    return urls;
  }

  init(selector) {
    const urls = this._extractUrls(this.config);
    const jwp = window.jwplayer;
    const p = $(`#${selector}`);
    if (!p.length) {
      throw new Error(`videoplayer selector '${selector}' not found`);
    }
    let w = p.innerWidth();
    let h = p.innerHeight();
    if (w === 0) {
      w = 100;
    }
    if (h === 0) {
      h = 300;
    }

    this.player = jwp(this.config.playerSettings.selector);
    this.player.setup({
      file: urls[0],
      image: this.config.playerSettings.poster,
      height: h,
      width: w,
      controls: true,
      autostart: false,
      displaytitle: false,
      displaydescription: false,
      nextUpDisplay: false,
      abouttext: 'Rosetta Group',
      aboutlink: 'http://www.rosettagroup.nl',
      stretching: 'fill',
      repeat: false,
    });
    const playlist = [];
    urls.forEach(url => {
      playlist.push({
        file: url,
        title: url,
        image: this.config.playerSettings.poster,
      });
    });
    const promise = new Promise((resolve, reject) => {
      this.player.once('ready', () => {
        this._handlePlayerReady(resolve);
      });
      this.player.load(playlist);
    });
    return promise;
  }

  _handlePlayerReady(resolve) {
    this.player.once('firstFrame', () => {
      this.player.pause();
      this.eventbus.broadcast(TimelineEventNames.DURATION, [this.getDuration()]);
      resolve(this);
    });
    this.player.on(TimelineEventNames.TIME, this._loopHandler.bind(this, Math.floor));
    this.player.on(TimelineEventNames.SEEKED, this._seekedHandler.bind(this));
    this.player.on(TimelineEventNames.COMPLETE, this._handlePlayerComplete.bind(this));
    setTimeout(() => {
      this.player.play();
    }, 10);
  }

  _handlePlayerComplete() {
    if (!this.loop) {
      this.stop();
      this.eventbus.broadcast(TimelineEventNames.COMPLETE, [this.player.getPlaylistIndex()]);
    }
  }

  _seekedHandler() {
    this.eventbus.broadcast(TimelineEventNames.SEEKED, [this.getPosition(), this.getDuration()]);
  }

  destroy() {
    this.player.remove();
    this._eventbusListeners.forEach(func => func());
  }

  _loopHandler(floor, event) {
    const pos = floor(event.position);
    if (this.loop && pos === floor(this.player.getDuration() - 1)) {
      this.seek(0);
    }
  }

  _timeResetLoopHandler(event) {
    if (this.loop) {
      this.seek(0);
    }
  }

  _addEventListeners() {
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.PLAY_TOGGLE_REQUEST, this.toggleplay.bind(this)));
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.PLAY_REQUEST, this.play.bind(this)));
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.STOP_REQUEST, this.stop.bind(this)));
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.PAUSE_REQUEST, this.pause.bind(this)));
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.SEEK_REQUEST, this.seek.bind(this)));
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.RESIZE_REQUEST, this.resize.bind(this)));
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.CONTAINER_REQUEST, this._container.bind(this)));
    this._eventbusListeners.push(this.eventbus.on(TimelineEventNames.DURATION_REQUEST, this.duration.bind(this)));
  }

  _container(resultCallback) {
    let suffix = '';
    if (this.player.getProvider().name !== 'html5') {
      suffix = '_wrapper';
    }
    const container = $(`#${this.providerid}${suffix}`);
    resultCallback(container);
  }

  toggleplay() {
    if (this.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  play() {
    this.paused = false;
    this.player.play();
    this.eventbus.broadcast(TimelineEventNames.PLAY);
  }

  stop() {
    this.paused = false;
    this.player.stop();
    this.eventbus.broadcast(TimelineEventNames.STOP);
  }

  pause() {
    this.paused = true;
    this.player.pause();
    this.eventbus.broadcast(TimelineEventNames.PAUSE);
  }

  seek(position) {
    const currentPosition = this.player.getPosition();
    this.player.seek(position);
    this.eventbus.broadcastForTopic(TimelineEventNames.SEEK, [position, currentPosition, this.player.getDuration()]);
  }

  resize(width, height) {
    this.player.resize(width, height);
    this.eventbus.broadcast(TimelineEventNames.RESIZE, [width, height]);
  }

  duration(resultCallback) {
    resultCallback(Math.floor(this.getDuration()));
  }

  playlistItem(index) {
    this.player.playlistItem(index);
  }

  once(eventName, callback) {
    this.player.once(eventName, callback);
  }

  off(eventName, callback) {
    this.player.off(eventName, callback);
  }

  on(eventName, callback) {
    this.player.on(eventName, callback);
  }

  getPosition() {
    return this.player.getPosition();
  }

  getPlaylistIndex() {
    return this.player.getPlaylistIndex();
  }

  getState() {
    return this.player.getState();
  }

  getDuration() {
    return this.player.getDuration();
  }

  getMute() {
    return this.player.getMute();
  }

  getVolume() {
    return this.player.getVolume();
  }

  setMute(state) {
    this.player.setMute(state);
  }

  setVolume(volume) {
    this.player.setVolume(volume);
  }
}

export default JwPlayerTimelineProvider;
