import $ from 'jquery';
import { v4 as uuidv4 } from 'uuid';
import { IResolvedEngineConfiguration } from '../configuration/types';
import { IEventbus, TEventHandlerRemover } from '../eventbus/types';
import { TimelineEventNames } from '../timeline-event-names';
import { TResultCallback } from '../types';
import { ITimelineProvider } from './types';

export class JwPlayerTimelineProvider implements ITimelineProvider {
  private _paused: boolean = false;
  private _player: any = null;
  private _currentLoopHandler: Function | null = null;
  private _eventbusListeners: TEventHandlerRemover[] = [];
  private _playlist: any[] = [];
  private _videoElementId: string = uuidv4();

  loop = false;

  constructor(
    private eventbus: IEventbus,
    private config: IResolvedEngineConfiguration
  ) {
    this._addEventListeners();
  }

  _extractUrls(configuration: IResolvedEngineConfiguration) {
    const urls = configuration.timelines
      .filter(timeline => timeline.type === 'mediaplayer')
      .map(timeline => {
        return timeline.uri;
      });
    return urls;
  }

  init(): Promise<any> {
    const settings = this.config.timelineProviderSettings['mediaplayer'];
    if (!settings) {
      throw new Error(`No settings found for 'mediaplayer' timeline provider`);
    }
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

    this._player = jwp(selector);
    this._player.setup({
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
    this._playlist.length = 0;
    urls.forEach(url => {
      const item = {
        file: url,
        title: url,
        image: settings.poster,
      };
      this._playlist.push(item);
    });
    const promise = new Promise(resolve => {
      this._player.once('ready', () => {
        this._handlePlayerReady(resolve);
      });
      this._player.load(this._playlist);
    });
    return promise;
  }

  _handlePlayerReady(resolve: (value: any | PromiseLike<any>) => void) {
    this._player.once('firstFrame', () => {
      this._player.pause();
      this.eventbus.broadcast(TimelineEventNames.DURATION, [
        this.getDuration(),
      ]);
      resolve(this);
    });
    this._player.on(
      TimelineEventNames.TIME,
      this._loopHandler.bind(this, Math.floor)
    );
    this._player.on(TimelineEventNames.SEEKED, this._seekedHandler.bind(this));
    this._player.on(
      TimelineEventNames.COMPLETE,
      this._handlePlayerComplete.bind(this)
    );
    setTimeout(() => {
      this._player.play();
    }, 10);
  }

  _handlePlayerComplete() {
    if (!this.loop) {
      this.stop();
      this.eventbus.broadcast(TimelineEventNames.COMPLETE, [
        this._player.getPlaylistIndex(),
      ]);
    }
  }

  _seekedHandler() {
    this.eventbus.broadcast(TimelineEventNames.SEEKED, [
      this.getPosition(),
      this.getDuration(),
    ]);
  }

  destroy() {
    this._player.remove();
    this._eventbusListeners.forEach(func => func());
  }

  _loopHandler(floor: (x: number) => number, jwplayerEvent: any) {
    const pos = floor(jwplayerEvent.position);
    if (this.loop && pos === floor(this._player.getDuration() - 1)) {
      this.seek(0);
    }
  }

  _timeResetLoopHandler() {
    if (this.loop) {
      this.seek(0);
    }
  }

  _addEventListeners() {
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
        this.resize.bind(this)
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
        this.duration.bind(this)
      )
    );
  }

  _container(resultCallback: TResultCallback) {
    let suffix = '';
    if (this._player.getProvider().name !== 'html5') {
      suffix = '_wrapper';
    }
    const container = $(`#${this._videoElementId}${suffix}`);
    resultCallback(container);
  }

  toggleplay() {
    if (this._paused) {
      this.start();
    } else {
      this.pause();
    }
  }

  start() {
    this._paused = false;
    this._player.play();
    this.eventbus.broadcast(TimelineEventNames.PLAY);
  }

  stop() {
    this._paused = false;
    this._player.stop();
    this.eventbus.broadcast(TimelineEventNames.STOP);
  }

  pause() {
    this._paused = true;
    this._player.pause();
    this.eventbus.broadcast(TimelineEventNames.PAUSE);
  }

  seek(position: number) {
    const currentPosition = this._player.getPosition();
    this._player.seek(position);
    this.eventbus.broadcast(TimelineEventNames.SEEK, [
      position,
      currentPosition,
      this._player.getDuration(),
    ]);
  }

  resize(width: number, height: number) {
    this._player.resize(width, height);
    this.eventbus.broadcast(TimelineEventNames.RESIZE, [width, height]);
  }

  duration(resultCallback: TResultCallback) {
    resultCallback(Math.floor(this.getDuration()));
  }

  playlistItem(uri: string) {
    const index = this._playlist.findIndex(item => item.file === uri);
    if (index > -1) {
      this._player.playlistItem(index);
    }
  }

  getPosition() {
    return this._player.getPosition();
  }

  getPlaylistIndex() {
    return this._player.getPlaylistIndex();
  }

  getState() {
    return this._player.getState();
  }

  getDuration() {
    return this._player.getDuration();
  }

  getMute() {
    return this._player.getMute();
  }

  getVolume() {
    return this._player.getVolume();
  }

  setMute(state: boolean) {
    this._player.setMute(state);
  }

  setVolume(volume: number) {
    this._player.setVolume(volume);
  }
}
