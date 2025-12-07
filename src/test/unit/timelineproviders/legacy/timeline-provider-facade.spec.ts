import {TimelineProviderFacade} from '@timelineproviders/legacy/timeline-provider-facade.ts';
import type {
  IContainerProvider,
  IPlaylist,
  IPositionSource,
  ISeekable,
  TBoundary,
  TSourceState,
} from '@timelineproviders/types.ts';
import {
  beforeEach,
  describe,
  expect,
  type Mock,
  type TestContext,
  test,
  vi,
} from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// Mock Position Source
// ─────────────────────────────────────────────────────────────────────────────

function createMockPositionSource(): IPositionSource &
  ISeekable & {
    _state: TSourceState;
    _position: number;
    _positionCallbacks: Array<(pos: number) => void>;
    _boundaryCallbacks: Array<(boundary: TBoundary) => void>;
    triggerPosition: (pos: number) => void;
    triggerBoundary: (boundary: TBoundary) => void;
  } {
  const source = {
    _state: 'inactive' as TSourceState,
    _position: 0,
    _positionCallbacks: [] as Array<(pos: number) => void>,
    _boundaryCallbacks: [] as Array<(boundary: TBoundary) => void>,
    loop: false,

    get state() {
      return this._state;
    },

    init: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),

    activate: vi.fn().mockImplementation(async function (this: typeof source) {
      this._state = 'active';
    }),
    suspend: vi.fn().mockImplementation(function (this: typeof source) {
      this._state = 'suspended';
    }),
    deactivate: vi.fn().mockImplementation(function (this: typeof source) {
      this._state = 'inactive';
      this._position = 0;
    }),

    getPosition: vi.fn().mockImplementation(function (this: typeof source) {
      return this._position;
    }),
    getDuration: vi.fn().mockReturnValue(100),

    onPosition: vi.fn().mockImplementation(function (
      this: typeof source,
      callback: (pos: number) => void
    ) {
      this._positionCallbacks.push(callback);
    }),
    onBoundaryReached: vi.fn().mockImplementation(function (
      this: typeof source,
      callback: (boundary: TBoundary) => void
    ) {
      this._boundaryCallbacks.push(callback);
    }),

    // ISeekable
    seek: vi.fn().mockImplementation(async function (
      this: typeof source,
      position: number
    ) {
      this._position = position;
      return position;
    }),

    // Test helpers
    triggerPosition(pos: number) {
      this._position = pos;
      for (const cb of this._positionCallbacks) {
        cb(pos);
      }
    },
    triggerBoundary(boundary: TBoundary) {
      for (const cb of this._boundaryCallbacks) {
        cb(boundary);
      }
    },
  };

  return source;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock Container Provider
// ─────────────────────────────────────────────────────────────────────────────

function createMockContainerProvider(): IContainerProvider & {
  _readyCallbacks: Array<() => void>;
  triggerReady: () => void;
} {
  const mockContainer = {length: 1} as unknown as JQuery<HTMLElement>;

  return {
    _readyCallbacks: [] as Array<() => void>,

    getContainer: vi.fn().mockReturnValue(mockContainer),
    onContainerReady: vi.fn().mockImplementation(function (
      this: ReturnType<typeof createMockContainerProvider>,
      callback: () => void
    ) {
      this._readyCallbacks.push(callback);
    }),

    triggerReady() {
      for (const cb of this._readyCallbacks) {
        cb();
      }
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock Playlist
// ─────────────────────────────────────────────────────────────────────────────

interface PlaylistItem {
  uri: string;
}

function createMockPlaylist(): IPlaylist<PlaylistItem> & {
  _currentIndex: number;
  _changeCallbacks: Array<(item: PlaylistItem) => void>;
} {
  const items: PlaylistItem[] = [
    {uri: '/videos/intro.mp4'},
    {uri: '/videos/chapter-1.mp4'},
  ];

  return {
    _currentIndex: 0,
    _changeCallbacks: [] as Array<(item: PlaylistItem) => void>,

    get currentItem() {
      return items[this._currentIndex];
    },
    get items() {
      return items;
    },

    selectItem: vi.fn().mockImplementation(function (
      this: ReturnType<typeof createMockPlaylist>,
      identifier: string
    ) {
      const index = items.findIndex(item => item.uri === identifier);
      if (index !== -1) {
        this._currentIndex = index;
        for (const cb of this._changeCallbacks) {
          cb(items[index]);
        }
      }
    }),
    onItemChange: vi.fn().mockImplementation(function (
      this: ReturnType<typeof createMockPlaylist>,
      callback: (item: PlaylistItem) => void
    ) {
      this._changeCallbacks.push(callback);
    }),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Context
// ─────────────────────────────────────────────────────────────────────────────

type TimelineProviderFacadeTestContext = {
  facade: TimelineProviderFacade;
  positionSource: ReturnType<typeof createMockPositionSource>;
  containerProvider: ReturnType<typeof createMockContainerProvider>;
  playlist: ReturnType<typeof createMockPlaylist>;
  onTimeCallback: Mock<(position: number) => void>;
  onCompleteCallback: Mock<() => void>;
  onRestartCallback: Mock<() => void>;
  onFirstFrameCallback: Mock<() => void>;
} & TestContext;

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('TimelineProviderFacade', () => {
  beforeEach<TimelineProviderFacadeTestContext>(context => {
    vi.clearAllMocks();

    context.positionSource = createMockPositionSource();
    context.containerProvider = createMockContainerProvider();
    context.playlist = createMockPlaylist();

    context.facade = new TimelineProviderFacade({
      positionSource: context.positionSource,
      containerProvider: context.containerProvider,
      playlist: context.playlist,
    });

    context.onTimeCallback = vi.fn();
    context.onCompleteCallback = vi.fn();
    context.onRestartCallback = vi.fn();
    context.onFirstFrameCallback = vi.fn();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // playState Mapping Tests (T050)
  // ───────────────────────────────────────────────────────────────────────────

  describe('playState mapping', () => {
    test<TimelineProviderFacadeTestContext>('given inactive source, when playState checked, then returns stopped', ({
      facade,
      positionSource,
    }) => {
      positionSource._state = 'inactive';
      expect(facade.playState).toBe('stopped');
    });

    test<TimelineProviderFacadeTestContext>('given active source, when playState checked, then returns running', ({
      facade,
      positionSource,
    }) => {
      positionSource._state = 'active';
      expect(facade.playState).toBe('running');
    });

    test<TimelineProviderFacadeTestContext>('given suspended source, when playState checked, then returns paused', ({
      facade,
      positionSource,
    }) => {
      positionSource._state = 'suspended';
      expect(facade.playState).toBe('paused');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Transport Method Delegation Tests (T051)
  // ───────────────────────────────────────────────────────────────────────────

  describe('transport method delegation', () => {
    test<TimelineProviderFacadeTestContext>('given facade, when init called, then position source init called', async ({
      facade,
      positionSource,
    }) => {
      await facade.init();
      expect(positionSource.init).toHaveBeenCalled();
    });

    test<TimelineProviderFacadeTestContext>('given facade, when start called, then position source activate called', async ({
      facade,
      positionSource,
    }) => {
      await facade.start();
      expect(positionSource.activate).toHaveBeenCalled();
    });

    test<TimelineProviderFacadeTestContext>('given facade, when pause called, then position source suspend called', ({
      facade,
      positionSource,
    }) => {
      facade.pause();
      expect(positionSource.suspend).toHaveBeenCalled();
    });

    test<TimelineProviderFacadeTestContext>('given facade, when stop called, then position source deactivate called', ({
      facade,
      positionSource,
    }) => {
      facade.stop();
      expect(positionSource.deactivate).toHaveBeenCalled();
    });

    test<TimelineProviderFacadeTestContext>('given facade, when destroy called, then position source destroy called', ({
      facade,
      positionSource,
    }) => {
      facade.destroy();
      expect(positionSource.destroy).toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Seek Delegation Tests (T052)
  // ───────────────────────────────────────────────────────────────────────────

  describe('seek delegation', () => {
    test<TimelineProviderFacadeTestContext>('given seekable source, when seek called, then delegates to source', async ({
      facade,
      positionSource,
    }) => {
      const result = await facade.seek(50);
      expect(positionSource.seek).toHaveBeenCalledWith(50);
      expect(result).toBe(50);
    });

    test<TimelineProviderFacadeTestContext>('given facade without seekable source, when seek called, then returns current position', async () => {
      const nonSeekableSource: IPositionSource = {
        state: 'inactive',
        loop: false,
        init: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn(),
        activate: vi.fn().mockResolvedValue(undefined),
        suspend: vi.fn(),
        deactivate: vi.fn(),
        getPosition: vi.fn().mockReturnValue(25),
        getDuration: vi.fn().mockReturnValue(100),
        onPosition: vi.fn(),
        onBoundaryReached: vi.fn(),
      };

      const facade = new TimelineProviderFacade({
        positionSource: nonSeekableSource,
      });

      const result = await facade.seek(50);
      expect(result).toBe(25);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Callback Mapping Tests (T053)
  // ───────────────────────────────────────────────────────────────────────────

  describe('callback mapping', () => {
    test<TimelineProviderFacadeTestContext>('given onTime registered, when position source emits position, then callback invoked', ({
      facade,
      positionSource,
      onTimeCallback,
    }) => {
      facade.onTime(onTimeCallback);
      positionSource.triggerPosition(42);
      expect(onTimeCallback).toHaveBeenCalledWith(42);
    });

    test<TimelineProviderFacadeTestContext>('given onComplete registered, when position source emits end boundary, then callback invoked', ({
      facade,
      positionSource,
      onCompleteCallback,
    }) => {
      positionSource.loop = false;
      facade.onComplete(onCompleteCallback);
      positionSource.triggerBoundary('end');
      expect(onCompleteCallback).toHaveBeenCalled();
    });

    test<TimelineProviderFacadeTestContext>('given onRestart registered with loop, when position source emits end boundary, then callback invoked', ({
      facade,
      positionSource,
      onRestartCallback,
    }) => {
      positionSource.loop = true;
      facade.onRestart(onRestartCallback);
      positionSource.triggerBoundary('end');
      expect(onRestartCallback).toHaveBeenCalled();
    });

    test<TimelineProviderFacadeTestContext>('given onFirstFrame registered, when container ready triggered, then callback invoked', ({
      facade,
      containerProvider,
      onFirstFrameCallback,
    }) => {
      facade.onFirstFrame(onFirstFrameCallback);
      containerProvider.triggerReady();
      expect(onFirstFrameCallback).toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Position and Duration Tests
  // ───────────────────────────────────────────────────────────────────────────

  describe('position and duration', () => {
    test<TimelineProviderFacadeTestContext>('given facade, when getPosition called, then delegates to source', ({
      facade,
      positionSource,
    }) => {
      positionSource._position = 42;
      expect(facade.getPosition()).toBe(42);
    });

    test<TimelineProviderFacadeTestContext>('given facade, when getDuration called, then delegates to source', ({
      facade,
      positionSource,
    }) => {
      expect(facade.getDuration()).toBe(100);
      expect(positionSource.getDuration).toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Container Tests
  // ───────────────────────────────────────────────────────────────────────────

  describe('container', () => {
    test<TimelineProviderFacadeTestContext>('given container provider, when getContainer called, then delegates to provider', ({
      facade,
      containerProvider,
    }) => {
      const container = facade.getContainer();
      expect(containerProvider.getContainer).toHaveBeenCalled();
      expect(container).toBeDefined();
    });

    test<TimelineProviderFacadeTestContext>('given no container provider, when getContainer called, then returns undefined', () => {
      const facade = new TimelineProviderFacade({
        positionSource: createMockPositionSource(),
      });

      expect(facade.getContainer()).toBeUndefined();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Playlist Tests
  // ───────────────────────────────────────────────────────────────────────────

  describe('playlist', () => {
    test<TimelineProviderFacadeTestContext>('given playlist, when playlistItem called, then delegates to playlist', ({
      facade,
      playlist,
    }) => {
      facade.playlistItem('/videos/chapter-1.mp4');
      expect(playlist.selectItem).toHaveBeenCalledWith('/videos/chapter-1.mp4');
    });

    test<TimelineProviderFacadeTestContext>('given no playlist, when playlistItem called, then does nothing', () => {
      const facade = new TimelineProviderFacade({
        positionSource: createMockPositionSource(),
      });

      // Should not throw
      expect(() => facade.playlistItem('/videos/chapter-1.mp4')).not.toThrow();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Loop Property Tests
  // ───────────────────────────────────────────────────────────────────────────

  describe('loop property', () => {
    test<TimelineProviderFacadeTestContext>('given facade, when loop get, then returns source loop', ({
      facade,
      positionSource,
    }) => {
      positionSource.loop = true;
      expect(facade.loop).toBe(true);
    });

    test<TimelineProviderFacadeTestContext>('given facade, when loop set, then sets source loop', ({
      facade,
      positionSource,
    }) => {
      facade.loop = true;
      expect(positionSource.loop).toBe(true);
    });
  });
});
