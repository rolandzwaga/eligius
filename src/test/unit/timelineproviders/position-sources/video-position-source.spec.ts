import {
  emitMediaEvent,
  getSourceElements,
  getVideoElement,
  type IMediaElementStubs,
  installMediaElementStubs,
  makeReady,
  setMediaProperty,
  timeRanges,
  trackEventListeners,
} from '@test/fixtures/video-element-factory.ts';
import {
  VideoPositionSource,
  type VideoPositionSourceConfig,
  type VideoSource,
} from '@timelineproviders/position-sources/video-position-source.ts';
import {isSeekable, type TBoundary} from '@timelineproviders/types.ts';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// Shared setup
// ─────────────────────────────────────────────────────────────────────────────

let media: IMediaElementStubs;

beforeEach(() => {
  media = installMediaElementStubs();
  document.body.innerHTML = '<div id="video-container"></div>';
});

afterEach(() => {
  document.body.innerHTML = '';
});

const TWO: VideoSource[] = [
  {src: 'video.mp4', type: 'video/mp4'},
  {src: 'video.webm', type: 'video/webm'},
];

function config(
  overrides: Partial<VideoPositionSourceConfig> = {}
): VideoPositionSourceConfig {
  return {
    selector: '#video-container',
    sources: [{src: 'video.mp4', type: 'video/mp4'}],
    ...overrides,
  };
}

function container(): HTMLElement {
  return document.getElementById('video-container') as HTMLElement;
}

async function initSource(
  source: VideoPositionSource,
  options?: {duration?: number}
): Promise<HTMLVideoElement> {
  const pending = source.init();
  const video = getVideoElement();
  makeReady(video, options);
  await pending;
  return video;
}

async function activeSource(options?: {
  duration?: number;
}): Promise<{source: VideoPositionSource; video: HTMLVideoElement}> {
  const source = new VideoPositionSource(config());
  const video = await initSource(source, options);
  await source.activate();
  return {source, video};
}

function trackSettlement(promise: Promise<unknown>): {settled: boolean} {
  const state = {settled: false};
  promise.then(
    () => {
      state.settled = true;
    },
    () => {
      state.settled = true;
    }
  );
  return state;
}

async function flushMicrotasks(): Promise<void> {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
}

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {promise, resolve, reject};
}

function mediaCallCount(): number {
  return (
    media.play.mock.calls.length +
    media.pause.mock.calls.length +
    media.load.mock.calls.length +
    media.canPlayType.mock.calls.length
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Construction
// ─────────────────────────────────────────────────────────────────────────────

describe('VideoPositionSource construction', () => {
  test('given a new source, when it is constructed, then it is inactive at position 0, creates no video element and calls no media method', () => {
    const source = new VideoPositionSource(config());

    expect(source.state).toBe('inactive');
    expect(source.getPosition()).toBe(0);
    expect(document.querySelector('video')).toBeNull();
    expect(mediaCallCount()).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Element creation
// ─────────────────────────────────────────────────────────────────────────────

describe('VideoPositionSource element creation', () => {
  test("given a container, when init() is called, then one video element whose id starts with 'video-' and whose class is 'eligius-video' is appended to the container and belongs to the container's document", () => {
    const source = new VideoPositionSource(config());

    source.init();

    const video = getVideoElement(container());
    expect(video.parentElement).toBe(container());
    expect(video.id.startsWith('video-')).toBe(true);
    expect(video.className).toBe('eligius-video');
    expect(video.ownerDocument).toBe(container().ownerDocument);
  });

  test("given init() was called, when the video element is inspected, then preload is 'auto', playsInline is true and controls, autoplay, loop and muted are false", () => {
    const source = new VideoPositionSource(config());

    source.init();

    const video = getVideoElement();
    expect(video.preload).toBe('auto');
    expect(video.playsInline).toBe(true);
    expect(video.controls).toBe(false);
    expect(video.autoplay).toBe(false);
    expect(video.loop).toBe(false);
    expect(video.muted).toBe(false);
  });

  test('given two sources, when init() is called, then the video has one source child per entry in order with their src and type attributes', () => {
    const source = new VideoPositionSource(config({sources: TWO}));

    source.init();

    const sources = getSourceElements(getVideoElement());
    expect(
      sources.map(element => [
        element.getAttribute('src'),
        element.getAttribute('type'),
      ])
    ).toEqual([
      ['video.mp4', 'video/mp4'],
      ['video.webm', 'video/webm'],
    ]);
  });

  test('given an audio/mpeg source, when init() is called, then its source child has type audio/mpeg and init() resolves on canplay', async () => {
    const source = new VideoPositionSource(
      config({sources: [{src: 'track.mp3', type: 'audio/mpeg'}]})
    );

    const pending = source.init();
    const video = getVideoElement();
    expect(getSourceElements(video)[0].getAttribute('type')).toBe('audio/mpeg');
    makeReady(video);

    await expect(pending).resolves.toBeUndefined();
  });

  test('given a source without a type, when init() is called, then its source child has no type attribute and canPlayType is not asked about it', () => {
    const source = new VideoPositionSource(
      config({sources: [{src: 'video.mp4'} as VideoSource]})
    );

    source.init();

    const [element] = getSourceElements(getVideoElement());
    expect(element.getAttribute('src')).toBe('video.mp4');
    expect(element.hasAttribute('type')).toBe(false);
    expect(media.canPlayType).not.toHaveBeenCalled();
  });

  test('given two sources of which the browser cannot play the first type, when init() is called, then only the second gets a source child', () => {
    media.canPlayType.mockImplementation(type =>
      type === 'video/mp4' ? '' : 'maybe'
    );
    const source = new VideoPositionSource(config({sources: TWO}));

    source.init();

    const sources = getSourceElements(getVideoElement());
    expect(sources.map(element => element.getAttribute('src'))).toEqual([
      'video.webm',
    ]);
  });

  test('given a poster, when init() is called, then the video has that poster attribute', () => {
    const source = new VideoPositionSource(config({poster: 'poster.jpg'}));

    source.init();

    expect(getVideoElement().getAttribute('poster')).toBe('poster.jpg');
  });

  test('given no poster, when init() is called, then the video has no poster attribute', () => {
    const source = new VideoPositionSource(config());

    source.init();

    expect(getVideoElement().hasAttribute('poster')).toBe(false);
  });

  test('given init() was called, when load() runs, then the video is already in the document and has its source children', () => {
    const seen: Array<[boolean, number]> = [];
    media.load.mockImplementation(function (this: HTMLMediaElement) {
      seen.push([this.isConnected, this.children.length]);
    });
    const source = new VideoPositionSource(config());

    source.init();

    expect(seen).toEqual([[true, 1]]);
  });

  test('given a selector that matches two elements, when init() is called, then only the first match gets a video element', () => {
    document.body.innerHTML =
      '<div class="player" id="first"></div><div class="player" id="second"></div>';
    const source = new VideoPositionSource(config({selector: '.player'}));

    source.init();

    expect(
      document.getElementById('first')?.querySelectorAll('video')
    ).toHaveLength(1);
    expect(
      document.getElementById('second')?.querySelectorAll('video')
    ).toHaveLength(0);
  });

  test('given loop set to true before init, when init() creates the element, then the native loop property is false', () => {
    const source = new VideoPositionSource(config());
    source.loop = true;

    source.init();

    expect(getVideoElement().loop).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Init settlement
// ─────────────────────────────────────────────────────────────────────────────

describe('VideoPositionSource init settlement', () => {
  test('given a pending init, when canplay fires, then init() resolves and the source is still inactive', async () => {
    const source = new VideoPositionSource(config());

    const pending = source.init();
    makeReady(getVideoElement());

    await expect(pending).resolves.toBeUndefined();
    expect(source.state).toBe('inactive');
  });

  test('given a pending init without canplay, when pending work has run, then init() has not settled', async () => {
    const source = new VideoPositionSource(config());

    const state = trackSettlement(source.init());
    await flushMicrotasks();

    expect(state.settled).toBe(false);
  });

  test("given two sources, when the last source fires error, then init() rejects with the source list and 'none of the sources could be played'", async () => {
    const source = new VideoPositionSource(config({sources: TWO}));

    const pending = source.init();
    const video = getVideoElement();
    emitMediaEvent(getSourceElements(video)[1], 'error');

    await expect(pending).rejects.toThrow(
      'VideoPositionSource: failed to load video (video.mp4, video.webm): none of the sources could be played'
    );
  });

  test("given two sources, when the first source fires error while networkState is NETWORK_NO_SOURCE, then init() rejects with 'none of the sources could be played'", async () => {
    const source = new VideoPositionSource(config({sources: TWO}));

    const pending = source.init();
    const video = getVideoElement();
    setMediaProperty(video, 'networkState', 3);
    emitMediaEvent(getSourceElements(video)[0], 'error');

    await expect(pending).rejects.toThrow(
      'VideoPositionSource: failed to load video (video.mp4, video.webm): none of the sources could be played'
    );
  });

  test('given two sources whose types the browser cannot play, when init() is called, then it rejects at once naming the sources and no video element is in the document', async () => {
    media.canPlayType.mockReturnValue('');
    const source = new VideoPositionSource(config({sources: TWO}));

    await expect(source.init()).rejects.toThrow(
      'VideoPositionSource: failed to load video (video.mp4, video.webm): none of the sources has a type this browser can play'
    );
    expect(document.querySelector('video')).toBeNull();
    expect(media.load).not.toHaveBeenCalled();
  });

  test('given two sources, when only the first source fires error while networkState is NETWORK_LOADING, then init() stays pending and resolves on canplay', async () => {
    const source = new VideoPositionSource(config({sources: TWO}));

    const pending = source.init();
    const state = trackSettlement(pending);
    const video = getVideoElement();
    setMediaProperty(video, 'networkState', 2);
    emitMediaEvent(getSourceElements(video)[0], 'error');
    await flushMicrotasks();

    expect(state.settled).toBe(false);

    makeReady(video);
    await expect(pending).resolves.toBeUndefined();
  });

  test('given a pending init, when the video fires error with a MediaError message, then init() rejects with the source list and that message', async () => {
    const source = new VideoPositionSource(config());

    const pending = source.init();
    const video = getVideoElement();
    setMediaProperty(video, 'error', {
      code: 4,
      message: 'MEDIA_ELEMENT_ERROR: Format error',
    });
    emitMediaEvent(video, 'error');

    await expect(pending).rejects.toThrow(
      'VideoPositionSource: failed to load video (video.mp4): MEDIA_ELEMENT_ERROR: Format error'
    );
  });

  test('given a pending init, when the video fires error with a MediaError without a message, then the rejection names MediaError code 4', async () => {
    const source = new VideoPositionSource(config());

    const pending = source.init();
    const video = getVideoElement();
    setMediaProperty(video, 'error', {code: 4, message: ''});
    emitMediaEvent(video, 'error');

    await expect(pending).rejects.toThrow(
      'VideoPositionSource: failed to load video (video.mp4): MediaError code 4'
    );
  });

  test('given init() resolved on canplay, when the video fires error afterwards, then no init listener remains and the source still activates', async () => {
    const tracker = trackEventListeners();
    const source = new VideoPositionSource(config());

    const video = await initSource(source);

    const active = tracker.activeOn(video);
    expect(active.some(listener => listener.type === 'canplay')).toBe(false);
    expect(
      active.some(listener => listener.type === 'error' && listener.capture)
    ).toBe(false);

    emitMediaEvent(video, 'error');
    await source.activate();

    expect(source.state).toBe('active');
  });

  test('given a failed init, when the rejection is observed, then the video element is removed and no listener of the source remains on it', async () => {
    const tracker = trackEventListeners();
    const source = new VideoPositionSource(config());

    const pending = source.init();
    const video = getVideoElement();
    const [sourceElement] = getSourceElements(video);
    emitMediaEvent(sourceElement, 'error');

    await expect(pending).rejects.toThrow(/failed to load video/);
    expect(video.isConnected).toBe(false);
    expect(document.querySelector('video')).toBeNull();
    expect(tracker.activeOn(video)).toEqual([]);
    expect(tracker.activeOn(sourceElement)).toEqual([]);
    expect(media.load).toHaveBeenCalledTimes(2);
    expect(media.pause).toHaveBeenCalled();
  });

  test('given a failed init, when init() is called again, then exactly one fresh video element is in the container, a canplay on the old element does not settle the new init, and the new init resolves on its own canplay', async () => {
    const source = new VideoPositionSource(config());

    const first = source.init();
    const oldVideo = getVideoElement();
    emitMediaEvent(getSourceElements(oldVideo)[0], 'error');
    await expect(first).rejects.toThrow(/failed to load video/);

    const second = source.init();
    const state = trackSettlement(second);
    const freshVideo = getVideoElement(container());
    expect(freshVideo).not.toBe(oldVideo);

    makeReady(oldVideo);
    await flushMicrotasks();
    expect(state.settled).toBe(false);

    makeReady(freshVideo);
    await expect(second).resolves.toBeUndefined();
    expect(container().querySelectorAll('video')).toHaveLength(1);
  });

  test('given an initialised source, when init() is called again, then it resolves and no second video element exists', async () => {
    const source = new VideoPositionSource(config());
    await initSource(source);

    await expect(source.init()).resolves.toBeUndefined();

    expect(document.querySelectorAll('video')).toHaveLength(1);
  });

  test('given a pending init, when init() is called a second time, then one video element exists and both calls resolve on canplay', async () => {
    const source = new VideoPositionSource(config());

    const first = source.init();
    const second = source.init();
    expect(document.querySelectorAll('video')).toHaveLength(1);
    makeReady(getVideoElement());

    await expect(first).resolves.toBeUndefined();
    await expect(second).resolves.toBeUndefined();
  });

  test('given a selector that matches nothing, when init() is called, then it rejects naming the selector and creates no element', async () => {
    const source = new VideoPositionSource(config({selector: '#missing'}));

    await expect(source.init()).rejects.toThrow(
      "VideoPositionSource: container not found for selector '#missing'"
    );
    expect(document.querySelector('video')).toBeNull();
  });

  test("given no sources, when init() is called, then it rejects naming 'sources' and creates no element", async () => {
    const source = new VideoPositionSource({
      selector: '#video-container',
      poster: 'poster.jpg',
    } as unknown as VideoPositionSourceConfig);

    await expect(source.init()).rejects.toThrow(
      "VideoPositionSource: 'sources' is required (an array of {src, type})"
    );
    expect(document.querySelector('video')).toBeNull();
  });

  test("given an empty sources array, when init() is called, then it rejects naming 'sources'", async () => {
    const source = new VideoPositionSource(config({sources: []}));

    await expect(source.init()).rejects.toThrow(
      "VideoPositionSource: 'sources' is required (an array of {src, type})"
    );
  });

  test('given a source entry without src, when init() is called, then it rejects naming sources[1].src and creates no element', async () => {
    const source = new VideoPositionSource(
      config({
        sources: [
          {src: 'a.mp4', type: 'video/mp4'},
          {type: 'video/webm'} as VideoSource,
        ],
      })
    );

    await expect(source.init()).rejects.toThrow(
      'VideoPositionSource: sources[1].src must be a non-empty string'
    );
    expect(document.querySelector('video')).toBeNull();
  });

  test("given a config with an options key, when init() is called, then it rejects naming 'options' and creates no element", async () => {
    const source = new VideoPositionSource({
      selector: '#video-container',
      options: {sources: [{src: 'video.mp4', type: 'video/mp4'}]},
    } as unknown as VideoPositionSourceConfig);

    await expect(source.init()).rejects.toThrow(
      /'options' is no longer supported/
    );
    expect(document.querySelector('video')).toBeNull();
  });

  test('given a pending init, when destroy() is called, then init() rejects as destroyed, the element is removed and a later canplay on it changes nothing', async () => {
    const source = new VideoPositionSource(config());

    const pending = source.init();
    const video = getVideoElement();
    source.destroy();

    await expect(pending).rejects.toThrow(/destroyed before init completed/);
    expect(video.isConnected).toBe(false);

    makeReady(video);
    await flushMicrotasks();
    expect(source.state).toBe('inactive');
    expect(source.getDuration()).toBe(0);
  });

  test('given a destroyed source, when init() is called, then it rejects as destroyed and creates no element', async () => {
    const source = new VideoPositionSource(config());
    source.destroy();

    await expect(source.init()).rejects.toThrow(/destroyed/);
    expect(document.querySelector('video')).toBeNull();
  });

  test('given a source that was initialised and then destroyed, when init() is called again, then it rejects as destroyed and creates no element', async () => {
    const source = new VideoPositionSource(config());
    await initSource(source);
    source.destroy();

    await expect(source.init()).rejects.toThrow(/destroyed/);
    expect(document.querySelector('video')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// State transitions
// ─────────────────────────────────────────────────────────────────────────────

describe('VideoPositionSource state transitions', () => {
  test('given an initialised source, when activate() is awaited, then the state is active and play() was called once', async () => {
    const source = new VideoPositionSource(config());
    await initSource(source);

    await source.activate();

    expect(source.state).toBe('active');
    expect(media.play).toHaveBeenCalledTimes(1);
  });

  test('given an active source, when suspend() is called, then the state is suspended and pause() was called', async () => {
    const {source} = await activeSource();

    source.suspend();

    expect(source.state).toBe('suspended');
    expect(media.pause).toHaveBeenCalledTimes(1);
  });

  test('given an active source at 15 seconds, when suspend() is called, then getPosition() is still 15', async () => {
    const {source, video} = await activeSource();
    video.currentTime = 15;
    emitMediaEvent(video, 'timeupdate');

    source.suspend();

    expect(source.getPosition()).toBe(15);
  });

  test('given an active source, when deactivate() is called, then it is inactive, pause() was called once and currentTime and getPosition() are 0', async () => {
    const {source, video} = await activeSource();
    video.currentTime = 20;
    emitMediaEvent(video, 'timeupdate');

    source.deactivate();

    expect(source.state).toBe('inactive');
    expect(media.pause).toHaveBeenCalledTimes(1);
    expect(video.currentTime).toBe(0);
    expect(source.getPosition()).toBe(0);
  });

  test('given an initialised inactive source, when deactivate() is called, then pause() is not called', async () => {
    const source = new VideoPositionSource(config());
    await initSource(source);

    source.deactivate();

    expect(media.pause).not.toHaveBeenCalled();
  });

  test('given a suspended source, when activate() is awaited, then play() is called again', async () => {
    const {source} = await activeSource();
    source.suspend();

    await source.activate();

    expect(source.state).toBe('active');
    expect(media.play).toHaveBeenCalledTimes(2);
  });

  test('given an uninitialised source, when activate(), suspend() and deactivate() are called, then nothing throws and no media method runs', async () => {
    const source = new VideoPositionSource(config());

    await source.activate();
    source.suspend();
    await source.activate();
    source.deactivate();

    expect(source.state).toBe('inactive');
    expect(mediaCallCount()).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Playback promises
// ─────────────────────────────────────────────────────────────────────────────

describe('VideoPositionSource playback promises', () => {
  test('given play() rejects with NotAllowedError, when activate() is awaited, then it rejects with that error, the state is inactive and onActivated is not called', async () => {
    const source = new VideoPositionSource(config());
    await initSource(source);
    const notAllowed = new DOMException('blocked', 'NotAllowedError');
    media.play.mockRejectedValueOnce(notAllowed);
    const activated = vi.fn();
    source.onActivated(activated);

    await expect(source.activate()).rejects.toBe(notAllowed);

    expect(source.state).toBe('inactive');
    expect(activated).not.toHaveBeenCalled();
  });

  test('given play() resolves, when activate() is awaited, then onActivated is called once', async () => {
    const source = new VideoPositionSource(config());
    await initSource(source);
    const activated = vi.fn();
    source.onActivated(activated);

    await source.activate();

    expect(activated).toHaveBeenCalledTimes(1);
  });

  test('given play, suspend, play while the first play() is pending, when the first rejects with AbortError and the second resolves, then the source is active and onActivated fires once', async () => {
    const source = new VideoPositionSource(config());
    await initSource(source);
    const plays: Array<ReturnType<typeof deferred<void>>> = [];
    media.play.mockImplementation(() => {
      const play = deferred<void>();
      plays.push(play);
      return play.promise;
    });
    const activated = vi.fn();
    source.onActivated(activated);

    const first = source.activate();
    source.suspend();
    const second = source.activate();
    plays[0].reject(new DOMException('aborted', 'AbortError'));
    plays[1].resolve();
    await first;
    await second;

    expect(source.state).toBe('active');
    expect(activated).toHaveBeenCalledTimes(1);
  });

  test('given play, deactivate, play while the first play() is pending, when the first rejects with AbortError and the second resolves, then the source is active and onActivated fires once', async () => {
    const source = new VideoPositionSource(config());
    await initSource(source);
    const plays: Array<ReturnType<typeof deferred<void>>> = [];
    media.play.mockImplementation(() => {
      const play = deferred<void>();
      plays.push(play);
      return play.promise;
    });
    const activated = vi.fn();
    source.onActivated(activated);

    const first = source.activate();
    source.deactivate();
    const second = source.activate();
    plays[0].reject(new DOMException('aborted', 'AbortError'));
    plays[1].resolve();
    await first;
    await second;

    expect(source.state).toBe('active');
    expect(activated).toHaveBeenCalledTimes(1);
    expect(media.pause).toHaveBeenCalledTimes(1);
  });

  test('given play() returns undefined as unstubbed jsdom does, when activate() is awaited, then the source is active', async () => {
    const source = new VideoPositionSource(config());
    await initSource(source);
    media.play.mockReturnValue(undefined as unknown as Promise<void>);

    await source.activate();

    expect(source.state).toBe('active');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Position updates
// ─────────────────────────────────────────────────────────────────────────────

describe('VideoPositionSource position updates', () => {
  test('given an active source, when timeupdate fires at 5.5 seconds, then the position callback receives 5.5 and getPosition() is 5.5', async () => {
    const {source, video} = await activeSource();
    const onPosition = vi.fn();
    source.onPosition(onPosition);

    video.currentTime = 5.5;
    emitMediaEvent(video, 'timeupdate');

    expect(onPosition).toHaveBeenCalledWith(5.5);
    expect(source.getPosition()).toBe(5.5);
  });

  test('given two position callbacks, when timeupdate fires, then both receive the position', async () => {
    const {source, video} = await activeSource();
    const first = vi.fn();
    const second = vi.fn();
    source.onPosition(first);
    source.onPosition(second);

    video.currentTime = 3;
    emitMediaEvent(video, 'timeupdate');

    expect(first).toHaveBeenCalledWith(3);
    expect(second).toHaveBeenCalledWith(3);
  });

  test('given a suspended source, when timeupdate fires, then no callback runs and the position is unchanged', async () => {
    const {source, video} = await activeSource();
    video.currentTime = 2;
    emitMediaEvent(video, 'timeupdate');
    source.suspend();
    const onPosition = vi.fn();
    source.onPosition(onPosition);

    video.currentTime = 8;
    emitMediaEvent(video, 'timeupdate');

    expect(onPosition).not.toHaveBeenCalled();
    expect(source.getPosition()).toBe(2);
  });

  test('given an initialised inactive source, when timeupdate fires, then the position stays 0', async () => {
    const source = new VideoPositionSource(config());
    const video = await initSource(source);

    video.currentTime = 4;
    emitMediaEvent(video, 'timeupdate');

    expect(source.getPosition()).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Duration
// ─────────────────────────────────────────────────────────────────────────────

describe('VideoPositionSource duration', () => {
  test('given media metadata with a duration of 120, when getDuration() is called, then it returns 120', async () => {
    const source = new VideoPositionSource(config());
    await initSource(source, {duration: 120});

    expect(source.getDuration()).toBe(120);
  });

  test('given no metadata yet, when getDuration() is called, then it returns 0 instead of NaN', async () => {
    const source = new VideoPositionSource(config());
    const video = await initSource(source);
    setMediaProperty(video, 'duration', Number.NaN);

    expect(source.getDuration()).toBe(0);
  });

  test('given unbounded media, when getDuration() is called, then it returns Infinity', async () => {
    const source = new VideoPositionSource(config());
    await initSource(source, {duration: Number.POSITIVE_INFINITY});

    expect(source.getDuration()).toBe(Number.POSITIVE_INFINITY);
  });

  test('given an uninitialised source, when getDuration() is called, then it returns 0', () => {
    const source = new VideoPositionSource(config());

    expect(source.getDuration()).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Seeking
// ─────────────────────────────────────────────────────────────────────────────

describe('VideoPositionSource seeking', () => {
  test('given a source, when checked with isSeekable, then it is seekable', () => {
    expect(isSeekable(new VideoPositionSource(config()))).toBe(true);
  });

  test('given a ready video, when seek(30) is called and seeked fires, then it resolves with 30 and getPosition() is 30', async () => {
    const source = new VideoPositionSource(config());
    const video = await initSource(source);

    const pending = source.seek(30);
    expect(video.currentTime).toBe(30);
    emitMediaEvent(video, 'seeked');

    await expect(pending).resolves.toBe(30);
    expect(source.getPosition()).toBe(30);
  });

  test('given an active source with a position callback, when a seek completes, then the callback receives the new position', async () => {
    const {source, video} = await activeSource();
    const onPosition = vi.fn();
    source.onPosition(onPosition);

    const pending = source.seek(12);
    emitMediaEvent(video, 'seeked');
    await pending;

    expect(onPosition).toHaveBeenCalledWith(12);
  });

  test('given a video that fires seeked synchronously when currentTime is assigned, when seek(10) is awaited, then it resolves with 10', async () => {
    const source = new VideoPositionSource(config());
    const video = await initSource(source);
    let time = 0;
    Object.defineProperty(video, 'currentTime', {
      configurable: true,
      get: () => time,
      set(value: number) {
        time = value;
        video.dispatchEvent(new Event('seeked'));
      },
    });

    await expect(source.seek(10)).resolves.toBe(10);
  });

  test("given a pending seek, when the video fires error instead of seeked, then the seek resolves with the media's current time and no seek listener remains", async () => {
    const tracker = trackEventListeners();
    const source = new VideoPositionSource(config());
    const video = await initSource(source);
    Object.defineProperty(video, 'currentTime', {
      configurable: true,
      get: () => 12,
      set: () => {},
    });

    const pending = source.seek(30);
    emitMediaEvent(video, 'error');

    await expect(pending).resolves.toBe(12);
    const types = tracker.activeOn(video).map(listener => listener.type);
    expect(types).not.toContain('seeked');
    expect(types).not.toContain('error');
    expect(types).not.toContain('emptied');
  });

  test('given a pending seek, when a source child fires error, then the seek settles', async () => {
    const source = new VideoPositionSource(config());
    const video = await initSource(source);

    const pending = source.seek(30);
    emitMediaEvent(getSourceElements(video)[0], 'error');

    await expect(pending).resolves.toEqual(expect.any(Number));
  });

  test("given a pending seek, when the media is reset with emptied, then the seek resolves with the media's current time", async () => {
    const source = new VideoPositionSource(config());
    const video = await initSource(source);
    Object.defineProperty(video, 'currentTime', {
      configurable: true,
      get: () => 12,
      set: () => {},
    });

    const pending = source.seek(30);
    emitMediaEvent(video, 'emptied');

    await expect(pending).resolves.toBe(12);
  });

  test('given a seek that completed with seeked, when the listeners are counted, then no seeked, error or emptied listener of the seek remains', async () => {
    const tracker = trackEventListeners();
    const source = new VideoPositionSource(config());
    const video = await initSource(source);

    const pending = source.seek(5);
    emitMediaEvent(video, 'seeked');
    await pending;

    expect(
      tracker
        .activeOn(video)
        .map(listener => listener.type)
        .sort()
    ).toEqual(['ended', 'playing', 'timeupdate']);
  });

  test("given a pending seek, when destroy() is called, then the seek resolves with the media's current time", async () => {
    const source = new VideoPositionSource(config());
    const video = await initSource(source);
    Object.defineProperty(video, 'currentTime', {
      configurable: true,
      get: () => 12,
      set: () => {},
    });

    const pending = source.seek(30);
    source.destroy();

    await expect(pending).resolves.toBe(12);
  });

  test('given a video without metadata, when seek(5) is called, then it resolves with 5 at once, sets currentTime and the reported position to 5 and adds no listener', async () => {
    const tracker = trackEventListeners();
    const source = new VideoPositionSource(config());
    const video = await initSource(source);
    setMediaProperty(video, 'readyState', 0);
    const before = tracker.activeOn(video);

    await expect(source.seek(5)).resolves.toBe(5);

    expect(video.currentTime).toBe(5);
    expect(source.getPosition()).toBe(5);
    expect(tracker.activeOn(video)).toEqual(before);
  });

  test('given a video with a MediaError, when seek(5) is called, then it resolves at once with the current time and adds no listener', async () => {
    const tracker = trackEventListeners();
    const source = new VideoPositionSource(config());
    const video = await initSource(source);
    video.currentTime = 7;
    setMediaProperty(video, 'error', {code: 2, message: ''});
    const before = tracker.activeOn(video);

    await expect(source.seek(5)).resolves.toBe(7);

    expect(tracker.activeOn(video)).toEqual(before);
  });

  test('given a ready video with nothing seekable, when seek(5) is called, then it resolves at once with the current time and adds no listener', async () => {
    const tracker = trackEventListeners();
    const source = new VideoPositionSource(config());
    const video = await initSource(source);
    video.currentTime = 3;
    setMediaProperty(video, 'seekable', timeRanges());
    const before = tracker.activeOn(video);

    await expect(source.seek(5)).resolves.toBe(3);

    expect(tracker.activeOn(video)).toEqual(before);
  });

  test("given an initialised source that was destroyed, when seek(30) is awaited, then it resolves with 0 and the removed element's currentTime is unchanged", async () => {
    const source = new VideoPositionSource(config());
    const video = await initSource(source);
    source.destroy();

    await expect(source.seek(30)).resolves.toBe(0);

    expect(video.currentTime).toBe(0);
  });

  test('given an uninitialised source, when seek(30) is awaited, then it resolves with 0', async () => {
    const source = new VideoPositionSource(config());

    await expect(source.seek(30)).resolves.toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// End of media
// ─────────────────────────────────────────────────────────────────────────────

describe('VideoPositionSource end of media', () => {
  test('given an active source, when ended fires, then the end boundary is emitted', async () => {
    const {source, video} = await activeSource();
    const boundaries: TBoundary[] = [];
    source.onBoundaryReached(boundary => boundaries.push(boundary));

    emitMediaEvent(video, 'ended');

    expect(boundaries[0]).toBe('end');
  });

  test('given loop false, when ended fires, then the source is inactive and currentTime is 0', async () => {
    const {source, video} = await activeSource();
    video.currentTime = 60;

    emitMediaEvent(video, 'ended');

    expect(source.state).toBe('inactive');
    expect(video.currentTime).toBe(0);
  });

  test('given loop true set after init, when ended fires, then end and start boundaries are emitted in order, currentTime and position are 0, play() is called again and the source stays active', async () => {
    const {source, video} = await activeSource();
    source.loop = true;
    const boundaries: TBoundary[] = [];
    source.onBoundaryReached(boundary => boundaries.push(boundary));
    video.currentTime = 60;
    emitMediaEvent(video, 'timeupdate');

    emitMediaEvent(video, 'ended');

    expect(boundaries).toEqual(['end', 'start']);
    expect(video.currentTime).toBe(0);
    expect(source.getPosition()).toBe(0);
    expect(media.play).toHaveBeenCalledTimes(2);
    expect(source.state).toBe('active');
  });

  test('given loop true and a rejected replay, when ended fires, then the rejection is handled', async () => {
    const {source, video} = await activeSource();
    source.loop = true;
    const replay = Promise.reject(new Error('replay blocked'));
    const catchSpy = vi.spyOn(replay, 'catch');
    media.play.mockReturnValueOnce(replay);

    emitMediaEvent(video, 'ended');

    expect(catchSpy).toHaveBeenCalled();
    await flushMicrotasks();
  });

  test('given loop true and an end callback that suspends the source, when ended fires, then no start boundary is emitted and play() is not called again', async () => {
    const {source, video} = await activeSource();
    source.loop = true;
    const boundaries: TBoundary[] = [];
    source.onBoundaryReached(boundary => {
      boundaries.push(boundary);
      if (boundary === 'end') {
        source.suspend();
      }
    });

    emitMediaEvent(video, 'ended');

    expect(boundaries).toEqual(['end']);
    expect(media.play).toHaveBeenCalledTimes(1);
    expect(source.state).toBe('suspended');
  });

  test('given loop true and a start callback that suspends the source, when ended fires, then play() is not called again', async () => {
    const {source, video} = await activeSource();
    source.loop = true;
    source.onBoundaryReached(boundary => {
      if (boundary === 'start') {
        source.suspend();
      }
    });

    emitMediaEvent(video, 'ended');

    expect(media.play).toHaveBeenCalledTimes(1);
    expect(source.state).toBe('suspended');
  });

  test('given a suspended source, when ended fires, then no boundary is emitted', async () => {
    const {source, video} = await activeSource();
    source.suspend();
    const onBoundary = vi.fn();
    source.onBoundaryReached(onBoundary);

    emitMediaEvent(video, 'ended');

    expect(onBoundary).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Container provider
// ─────────────────────────────────────────────────────────────────────────────

describe('VideoPositionSource container provider', () => {
  test('given a source, when its methods are inspected, then it provides getContainer and onContainerReady', () => {
    const source = new VideoPositionSource(config());

    expect(typeof source.getContainer).toBe('function');
    expect(typeof source.onContainerReady).toBe('function');
  });

  test("given an initialised source, when getContainer() is called, then it returns the selector's element and not the video", async () => {
    const source = new VideoPositionSource(config());
    const video = await initSource(source);

    const result = source.getContainer();

    expect(result?.length).toBe(1);
    expect(result?.get(0)).toBe(container());
    expect(result?.get(0)).not.toBe(video);
  });

  test('given a registered ready callback, when the first playing fires, then it runs once and a second playing does not run it again', async () => {
    const {source, video} = await activeSource();
    const ready = vi.fn();
    source.onContainerReady(ready);

    emitMediaEvent(video, 'playing');
    emitMediaEvent(video, 'playing');

    expect(ready).toHaveBeenCalledTimes(1);
  });

  test('given two registered ready callbacks, when playing fires, then both run', async () => {
    const {source, video} = await activeSource();
    const first = vi.fn();
    const second = vi.fn();
    source.onContainerReady(first);
    source.onContainerReady(second);

    emitMediaEvent(video, 'playing');

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  test('given the container is already ready, when onContainerReady is called, then the callback runs immediately', async () => {
    const {source, video} = await activeSource();
    emitMediaEvent(video, 'playing');
    const late = vi.fn();

    source.onContainerReady(late);

    expect(late).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Destroy
// ─────────────────────────────────────────────────────────────────────────────

describe('VideoPositionSource destroy', () => {
  test('given an initialised source, when destroy() is called, then the state is inactive', async () => {
    const {source} = await activeSource();

    source.destroy();

    expect(source.state).toBe('inactive');
  });

  test('given an initialised source, when destroy() is called, then it pauses, removes the source children and the src attribute before load(), and removes the video from the document', async () => {
    const source = new VideoPositionSource(config());
    const video = await initSource(source);
    video.setAttribute('src', 'video.mp4');
    const seen: Array<[number, boolean]> = [];
    media.load.mockImplementation(function (this: HTMLMediaElement) {
      seen.push([this.children.length, this.hasAttribute('src')]);
    });

    source.destroy();

    expect(media.pause).toHaveBeenCalled();
    expect(seen.at(-1)).toEqual([0, false]);
    expect(video.isConnected).toBe(false);
    expect(document.querySelector('video')).toBeNull();
  });

  test('given an active source with a pending seek and a registered ready callback, when destroy() is called, then no listener of the source remains on the video or its sources', async () => {
    const tracker = trackEventListeners();
    const {source, video} = await activeSource();
    const sourceElements = getSourceElements(video);
    const pending = source.seek(10);
    source.onContainerReady(vi.fn());

    source.destroy();
    await pending;

    expect(tracker.activeOn(video)).toEqual([]);
    for (const element of sourceElements) {
      expect(tracker.activeOn(element)).toEqual([]);
    }
  });

  test('given a destroyed source, when timeupdate, ended and playing are dispatched on the removed element, then no position, boundary or container-ready callback runs', async () => {
    const {source, video} = await activeSource();
    const onPosition = vi.fn();
    const onBoundary = vi.fn();
    const ready = vi.fn();
    source.onPosition(onPosition);
    source.onBoundaryReached(onBoundary);
    source.onContainerReady(ready);

    source.destroy();
    video.currentTime = 9;
    emitMediaEvent(video, 'timeupdate');
    emitMediaEvent(video, 'ended');
    emitMediaEvent(video, 'playing');

    expect(onPosition).not.toHaveBeenCalled();
    expect(onBoundary).not.toHaveBeenCalled();
    expect(ready).not.toHaveBeenCalled();
  });

  test('given a registered ready callback, when destroy() is called, then the source drops the callback so a later container-ready notification runs nothing', async () => {
    const {source} = await activeSource();
    const ready = vi.fn();
    source.onContainerReady(ready);

    source.destroy();
    // No public path reaches the notification after destroy(); call the
    // private method to prove destroy() released the callback
    (
      source as unknown as {_notifyContainerReady(): void}
    )._notifyContainerReady();

    expect(ready).not.toHaveBeenCalled();
  });

  test('given an uninitialised source, when destroy() is called, then nothing throws and no media method runs', () => {
    const source = new VideoPositionSource(config());

    expect(() => source.destroy()).not.toThrow();
    expect(mediaCallCount()).toBe(0);
  });
});
