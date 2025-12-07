/**
 * Integration tests for composed timeline (position source + container + playlist).
 *
 * Tests the decomposed timeline provider architecture working together.
 */
import {DomContainerProvider} from '@timelineproviders/container-providers/dom-container-provider.ts';
import {TimelineProviderFacade} from '@timelineproviders/legacy/timeline-provider-facade.ts';
import {SimplePlaylist} from '@timelineproviders/playlist/simple-playlist.ts';
import {RafPositionSource} from '@timelineproviders/position-sources/raf-position-source.ts';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';

// Use vi.hoisted() for shared mock state
const mocks = vi.hoisted(() => {
  let capturedCallback: ((time: number) => void) | null = null;
  let capturedSignal: AbortSignal | null = null;

  return {
    getCapturedCallback: () => capturedCallback,
    getCapturedSignal: () => capturedSignal,
    reset: () => {
      capturedCallback = null;
      capturedSignal = null;
    },
    setCallback: (cb: (time: number) => void, signal: AbortSignal) => {
      capturedCallback = cb;
      capturedSignal = signal;
    },
  };
});

// Mock animationInterval for RAF-based source
vi.mock('@util/animation-interval.ts', () => ({
  animationInterval: vi.fn(
    (_ms: number, signal: AbortSignal, callback: (time: number) => void) => {
      mocks.setCallback(callback, signal);
    }
  ),
}));

// Mock jQuery for container provider
vi.mock('jquery', () => {
  const mockElement = document.createElement('div');
  mockElement.id = 'timeline-container';

  const jQueryMock = vi.fn((_selector: string) => ({
    length: 1,
    get: vi.fn().mockReturnValue(mockElement),
    0: mockElement,
  }));

  return {default: jQueryMock};
});

interface PlaylistItem {
  id: string;
  uri: string;
  title: string;
}

describe('Composed Timeline Integration', () => {
  let positionSource: RafPositionSource;
  let containerProvider: DomContainerProvider;
  let playlist: SimplePlaylist<PlaylistItem>;
  let facade: TimelineProviderFacade;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mocks.reset();

    // Create position source
    positionSource = new RafPositionSource({
      duration: 10,
      tickInterval: 1000,
    });

    // Create container provider
    containerProvider = new DomContainerProvider({
      selector: '#timeline-container',
    });

    // Create playlist
    playlist = new SimplePlaylist<PlaylistItem>({
      items: [
        {id: 'intro', uri: '/videos/intro.mp4', title: 'Introduction'},
        {id: 'ch1', uri: '/videos/chapter-1.mp4', title: 'Chapter 1'},
        {id: 'ch2', uri: '/videos/chapter-2.mp4', title: 'Chapter 2'},
      ],
      identifierKey: 'id',
    });

    // Compose into facade
    facade = new TimelineProviderFacade({
      positionSource,
      containerProvider,
      playlist,
    });
  });

  afterEach(() => {
    facade.destroy();
    vi.useRealTimers();
  });

  // Helper to initialize facade with fake timers
  async function initFacade(): Promise<void> {
    // Initialize both position source and container provider
    await positionSource.init();
    await containerProvider.init();
  }

  describe('initialization', () => {
    test('given all components, when initialized, then initializes successfully', async () => {
      await initFacade();
      expect(positionSource.state).toBe('inactive');
    });

    test('given initialized components, when getContainer called, then returns container element', async () => {
      await initFacade();
      const container = facade.getContainer();
      expect(container).toBeDefined();
      expect(container?.length).toBe(1);
    });

    test('given initialized facade, when getDuration called, then returns position source duration', async () => {
      await initFacade();
      expect(facade.getDuration()).toBe(10);
    });
  });

  describe('playback state transitions', () => {
    test('given initialized facade, when start called, then playState becomes running', async () => {
      await initFacade();
      await facade.start();
      expect(facade.playState).toBe('running');
    });

    test('given running facade, when pause called, then playState becomes paused', async () => {
      await initFacade();
      await facade.start();
      facade.pause();
      expect(facade.playState).toBe('paused');
    });

    test('given running facade, when stop called, then playState becomes stopped', async () => {
      await initFacade();
      await facade.start();
      facade.stop();
      expect(facade.playState).toBe('stopped');
    });

    test('given paused facade, when start called, then playState becomes running', async () => {
      await initFacade();
      await facade.start();
      facade.pause();
      await facade.start();
      expect(facade.playState).toBe('running');
    });
  });

  describe('playlist integration', () => {
    test('given facade with playlist, when playlistItem called, then current item changes', async () => {
      await initFacade();

      const changeCallback = vi.fn();
      playlist.onItemChange(changeCallback);

      facade.playlistItem('ch1');

      expect(changeCallback).toHaveBeenCalledWith(
        expect.objectContaining({id: 'ch1', title: 'Chapter 1'})
      );
    });

    test('given playlist, when cycling through items, then all items accessible', async () => {
      await initFacade();

      expect(playlist.currentItem.id).toBe('intro');

      facade.playlistItem('ch1');
      expect(playlist.currentItem.id).toBe('ch1');

      facade.playlistItem('ch2');
      expect(playlist.currentItem.id).toBe('ch2');

      facade.playlistItem('intro');
      expect(playlist.currentItem.id).toBe('intro');
    });
  });

  describe('position updates', () => {
    test('given onTime callback, when position source ticks, then callback receives position', async () => {
      await initFacade();

      const timeCallback = vi.fn();
      facade.onTime(timeCallback);

      await facade.start();

      // Get the captured callback and trigger it
      const callback = mocks.getCapturedCallback();
      expect(callback).not.toBeNull();

      // Simulate tick at 1000ms
      callback!(1000);

      expect(timeCallback).toHaveBeenCalledWith(1);
    });

    test('given running facade, when multiple ticks occur, then position updates correctly', async () => {
      await initFacade();

      const timeCallback = vi.fn();
      facade.onTime(timeCallback);

      await facade.start();

      const callback = mocks.getCapturedCallback();

      // Simulate multiple ticks
      callback!(1000);
      callback!(2000);
      callback!(3000);

      // 4 calls total: initial position (0) + 3 ticks (1, 2, 3)
      expect(timeCallback).toHaveBeenCalledTimes(4);
      expect(timeCallback).toHaveBeenLastCalledWith(3);
    });
  });

  describe('loop property', () => {
    test('given facade, when loop set on facade, then position source loop updated', async () => {
      await initFacade();

      facade.loop = true;
      expect(positionSource.loop).toBe(true);

      facade.loop = false;
      expect(positionSource.loop).toBe(false);
    });
  });

  describe('seek functionality', () => {
    test('given running facade, when seek called, then position updates', async () => {
      await initFacade();
      await facade.start();

      const result = await facade.seek(5);

      expect(result).toBe(5);
      expect(facade.getPosition()).toBe(5);
    });
  });
});
