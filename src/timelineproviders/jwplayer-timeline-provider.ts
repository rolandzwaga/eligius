import $ from 'jquery';
import TimelineEventNames from '../timeline-event-names';
import { ITimelineProvider } from './types';
import { IEventbus, TEventHandlerRemover } from '../eventbus/types';
import { IEngineConfiguration, TResultCallback } from '../types';
import { v4 as uuidv4 } from 'uuid';

class JwPlayerTimelineProvider implements ITimelineProvider {
  #paused: boolean = false;
  #player: any = null;
  #currentLoopHandler: Function | null = null;
  #eventbusListeners: TEventHandlerRemover[] = [];
  #playlist: any[] = [];
  #videoElementId: string = uuidv4();

  loop = false;

  constructor(private eventbus: IEventbus, private config: IEngineConfiguration) {
    this._addEventListeners();
  }

  _extractUrls(configuration: IEngineConfiguration) {
    const urls = configuration.timelines
      .filter((timeline) => timeline.type === 'mediaplayer')
      .map((timeline) => {
        return timeline.uri;
      });
    return urls;
  }

  init(): Promise<any> {
    const settings = this.config.timelineProviderSettings['mediaplayer'];
    const { selector } = settings;
    const urls = this._extractUrls(this.config);
    const jwp = (window as any).jwplayer;
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

    this.#player = jwp(selector);
    this.#player.setup({
      file: urls[0],
      image: settings.poster,
      height: h,
      width: w,
      controls: true,
      autostart: false,
      displaytitle: false,
      displaydescription: false,
      nextUpDisplay: false,
      abouttext: 'ChronoTriggerJS',
      aboutlink: 'http://www.google.com',
      stretching: 'fill',
      repeat: false,
    });
    this.#playlist.length = 0;
    urls.forEach((url) => {
      const item = {
        file: url,
        title: url,
        image: settings.poster,
      };
      this.#playlist.push(item);
    });
    const promise = new Promise((resolve) => {
      this.#player.once('ready', () => {
        this._handlePlayerReady(resolve);
      });
      this.#player.load(this.#playlist);
    });
    return promise;
  }

  _handlePlayerReady(resolve: (value: any | PromiseLike<any>) => void) {
    this.#player.once('firstFrame', () => {
      this.#player.pause();
      this.eventbus.broadcast(TimelineEventNames.DURATION, [this.getDuration()]);
      resolve(this);
    });
    this.#player.on(TimelineEventNames.TIME, this._loopHandler.bind(this, Math.floor));
    this.#player.on(TimelineEventNames.SEEKED, this._seekedHandler.bind(this));
    this.#player.on(TimelineEventNames.COMPLETE, this._handlePlayerComplete.bind(this));
    setTimeout(() => {
      this.#player.play();
    }, 10);
  }

  _handlePlayerComplete() {
    if (!this.loop) {
      this.stop();
      this.eventbus.broadcast(TimelineEventNames.COMPLETE, [this.#player.getPlaylistIndex()]);
    }
  }

  _seekedHandler() {
    this.eventbus.broadcast(TimelineEventNames.SEEKED, [this.getPosition(), this.getDuration()]);
  }

  destroy() {
    this.#player.remove();
    this.#eventbusListeners.forEach((func) => func());
  }

  _loopHandler(floor: (x: number) => number, jwplayerEvent: any) {
    const pos = floor(jwplayerEvent.position);
    if (this.loop && pos === floor(this.#player.getDuration() - 1)) {
      this.seek(0);
    }
  }

  _timeResetLoopHandler() {
    if (this.loop) {
      this.seek(0);
    }
  }

  _addEventListeners() {
    this.#eventbusListeners.push(this.eventbus.on(TimelineEventNames.PLAY_TOGGLE_REQUEST, this.toggleplay.bind(this)));
    this.#eventbusListeners.push(this.eventbus.on(TimelineEventNames.PLAY_REQUEST, this.start.bind(this)));
    this.#eventbusListeners.push(this.eventbus.on(TimelineEventNames.STOP_REQUEST, this.stop.bind(this)));
    this.#eventbusListeners.push(this.eventbus.on(TimelineEventNames.PAUSE_REQUEST, this.pause.bind(this)));
    this.#eventbusListeners.push(this.eventbus.on(TimelineEventNames.SEEK_REQUEST, this.seek.bind(this)));
    this.#eventbusListeners.push(this.eventbus.on(TimelineEventNames.RESIZE_REQUEST, this.resize.bind(this)));
    this.#eventbusListeners.push(this.eventbus.on(TimelineEventNames.CONTAINER_REQUEST, this._container.bind(this)));
    this.#eventbusListeners.push(this.eventbus.on(TimelineEventNames.DURATION_REQUEST, this.duration.bind(this)));
  }

  _container(resultCallback: TResultCallback) {
    let suffix = '';
    if (this.#player.getProvider().name !== 'html5') {
      suffix = '_wrapper';
    }
    const container = $(`#${this.#videoElementId}${suffix}`);
    resultCallback(container);
  }

  toggleplay() {
    if (this.#paused) {
      this.start();
    } else {
      this.pause();
    }
  }

  start() {
    this.#paused = false;
    this.#player.play();
    this.eventbus.broadcast(TimelineEventNames.PLAY);
  }

  stop() {
    this.#paused = false;
    this.#player.stop();
    this.eventbus.broadcast(TimelineEventNames.STOP);
  }

  pause() {
    this.#paused = true;
    this.#player.pause();
    this.eventbus.broadcast(TimelineEventNames.PAUSE);
  }

  seek(position: number) {
    const currentPosition = this.#player.getPosition();
    this.#player.seek(position);
    this.eventbus.broadcast(TimelineEventNames.SEEK, [position, currentPosition, this.#player.getDuration()]);
  }

  resize(width: number, height: number) {
    this.#player.resize(width, height);
    this.eventbus.broadcast(TimelineEventNames.RESIZE, [width, height]);
  }

  duration(resultCallback: TResultCallback) {
    resultCallback(Math.floor(this.getDuration()));
  }

  playlistItem(uri: string) {
    const index = this.#playlist.findIndex((item) => item.file === uri);
    if (index > -1) {
      this.#player.playlistItem(index);
    }
  }

  getPosition() {
    return this.#player.getPosition();
  }

  getPlaylistIndex() {
    return this.#player.getPlaylistIndex();
  }

  getState() {
    return this.#player.getState();
  }

  getDuration() {
    return this.#player.getDuration();
  }

  getMute() {
    return this.#player.getMute();
  }

  getVolume() {
    return this.#player.getVolume();
  }

  setMute(state: boolean) {
    this.#player.setMute(state);
  }

  setVolume(volume: number) {
    this.#player.setVolume(volume);
  }
}

export default JwPlayerTimelineProvider;
