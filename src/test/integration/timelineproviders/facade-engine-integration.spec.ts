/**
 * Integration tests for TimelineProviderFacade with EligiusEngine.
 *
 * Verifies that the facade correctly adapts the new decomposed architecture
 * to work with the legacy engine interface.
 */
import type {
  IResolvedEngineConfiguration,
  IResolvedTimelineConfiguration,
} from '@configuration/types.ts';
import {Eventbus, type IEventbus} from '@eventbus/index.ts';
import {DomContainerProvider} from '@timelineproviders/container-providers/dom-container-provider.ts';
import {TimelineProviderFacade} from '@timelineproviders/legacy/timeline-provider-facade.ts';
import {SimplePlaylist} from '@timelineproviders/playlist/simple-playlist.ts';
import {RafPositionSource} from '@timelineproviders/position-sources/raf-position-source.ts';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {EligiusEngine} from '../../../eligius-engine.ts';
import {LanguageManager} from '../../../language-manager.ts';
import type {ITimelineProviderInfo, TimelineTypes} from '../../../types.ts';

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
    html: vi.fn(),
    empty: vi.fn(),
    0: mockElement,
  }));

  return {default: jQueryMock};
});

interface PlaylistItem {
  id: string;
  uri: string;
  title: string;
}

function createMinimalConfig(): IResolvedEngineConfiguration {
  return {
    id: 'test-config',
    engine: {systemName: 'EligiusEngine'},
    timelineProviderSettings: {
      animation: {
        id: 'facade-provider',
        systemName: 'TimelineProviderFacade',
        vendor: 'eligius',
      },
    },
    containerSelector: '#app',
    language: 'en-US',
    layoutTemplate: '<div id="content"></div>',
    cssFiles: [],
    availableLanguages: [],
    initActions: [],
    actions: [],
    timelines: [
      {
        id: 'timeline-1',
        uri: 'timeline-1',
        type: 'animation',
        duration: 10,
        loop: false,
        selector: '#content',
        timelineActions: [],
      } as IResolvedTimelineConfiguration,
    ],
    timelineFlow: undefined,
    labels: [],
  };
}

describe('TimelineProviderFacade Engine Integration', () => {
  let positionSource: RafPositionSource;
  let containerProvider: DomContainerProvider;
  let playlist: SimplePlaylist<PlaylistItem>;
  let facade: TimelineProviderFacade;
  let eventbus: IEventbus;
  let languageManager: LanguageManager;
  let engine: EligiusEngine;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mocks.reset();

    // Create decomposed components
    positionSource = new RafPositionSource({
      duration: 10,
      tickInterval: 1000,
    });

    containerProvider = new DomContainerProvider({
      selector: '#timeline-container',
    });

    playlist = new SimplePlaylist<PlaylistItem>({
      items: [
        {id: 'intro', uri: '/videos/intro.mp4', title: 'Introduction'},
        {id: 'ch1', uri: '/videos/chapter-1.mp4', title: 'Chapter 1'},
      ],
      identifierKey: 'id',
    });

    // Compose into facade
    facade = new TimelineProviderFacade({
      positionSource,
      containerProvider,
      playlist,
    });

    // Create engine dependencies
    eventbus = new Eventbus();
    languageManager = new LanguageManager('en-US', []);
  });

  afterEach(async () => {
    if (engine) {
      await engine.destroy();
    }
    vi.useRealTimers();
  });

  // Helper to initialize facade before using with engine
  async function initFacade(): Promise<void> {
    await positionSource.init();
    await containerProvider.init();
  }

  describe('facade as timeline provider', () => {
    test('given facade, when used as ITimelineProvider, then engine accepts it', async () => {
      await initFacade();

      const timelineProviders: Record<TimelineTypes, ITimelineProviderInfo> = {
        animation: {
          id: 'facade-provider',
          vendor: 'eligius',
          provider: facade,
        },
        mediaplayer: {
          id: 'mediaplayer-provider',
          vendor: 'eligius',
          provider: facade,
        },
      };

      const config = createMinimalConfig();
      engine = new EligiusEngine(
        config,
        eventbus,
        timelineProviders,
        languageManager
      );

      // Engine should accept the facade without errors
      expect(engine).toBeDefined();
    });

    test('given engine with facade, when init called, then initializes successfully', async () => {
      await initFacade();

      const timelineProviders: Record<TimelineTypes, ITimelineProviderInfo> = {
        animation: {
          id: 'facade-provider',
          vendor: 'eligius',
          provider: facade,
        },
        mediaplayer: {
          id: 'mediaplayer-provider',
          vendor: 'eligius',
          provider: facade,
        },
      };

      const config = createMinimalConfig();
      engine = new EligiusEngine(
        config,
        eventbus,
        timelineProviders,
        languageManager
      );

      const provider = await engine.init();
      expect(provider).toBeDefined();
    });
  });

  describe('playback control via eventbus', () => {
    test('given initialized engine with facade, when timeline-play-request, then facade starts', async () => {
      await initFacade();

      const timelineProviders: Record<TimelineTypes, ITimelineProviderInfo> = {
        animation: {
          id: 'facade-provider',
          vendor: 'eligius',
          provider: facade,
        },
        mediaplayer: {
          id: 'mediaplayer-provider',
          vendor: 'eligius',
          provider: facade,
        },
      };

      const config = createMinimalConfig();
      engine = new EligiusEngine(
        config,
        eventbus,
        timelineProviders,
        languageManager
      );

      await engine.init();
      eventbus.broadcast('timeline-play-request', []);

      expect(facade.playState).toBe('running');
    });

    test('given running engine with facade, when timeline-pause-request, then facade pauses', async () => {
      await initFacade();

      const timelineProviders: Record<TimelineTypes, ITimelineProviderInfo> = {
        animation: {
          id: 'facade-provider',
          vendor: 'eligius',
          provider: facade,
        },
        mediaplayer: {
          id: 'mediaplayer-provider',
          vendor: 'eligius',
          provider: facade,
        },
      };

      const config = createMinimalConfig();
      engine = new EligiusEngine(
        config,
        eventbus,
        timelineProviders,
        languageManager
      );

      await engine.init();
      eventbus.broadcast('timeline-play-request', []);
      eventbus.broadcast('timeline-pause-request', []);

      expect(facade.playState).toBe('paused');
    });

    test('given running engine with facade, when timeline-stop-request, then facade stops', async () => {
      await initFacade();

      const timelineProviders: Record<TimelineTypes, ITimelineProviderInfo> = {
        animation: {
          id: 'facade-provider',
          vendor: 'eligius',
          provider: facade,
        },
        mediaplayer: {
          id: 'mediaplayer-provider',
          vendor: 'eligius',
          provider: facade,
        },
      };

      const config = createMinimalConfig();
      engine = new EligiusEngine(
        config,
        eventbus,
        timelineProviders,
        languageManager
      );

      await engine.init();
      eventbus.broadcast('timeline-play-request', []);
      eventbus.broadcast('timeline-stop-request', []);

      expect(facade.playState).toBe('stopped');
    });
  });

  describe('position updates', () => {
    test('given engine with facade, when position updates, then engine receives time events', async () => {
      await initFacade();

      const timelineProviders: Record<TimelineTypes, ITimelineProviderInfo> = {
        animation: {
          id: 'facade-provider',
          vendor: 'eligius',
          provider: facade,
        },
        mediaplayer: {
          id: 'mediaplayer-provider',
          vendor: 'eligius',
          provider: facade,
        },
      };

      const config = createMinimalConfig();
      engine = new EligiusEngine(
        config,
        eventbus,
        timelineProviders,
        languageManager
      );

      await engine.init();

      const timeCallback = vi.fn();
      eventbus.on('timeline-time', timeCallback);

      eventbus.broadcast('timeline-play-request', []);

      // Get the captured callback and simulate ticks
      const callback = mocks.getCapturedCallback();
      expect(callback).not.toBeNull();

      // Simulate tick at 1000ms
      callback!(1000);

      // The engine should receive timeline-time events
      expect(timeCallback).toHaveBeenCalled();
    });
  });

  describe('duration and position queries', () => {
    test('given engine with facade, when getDuration called, then returns facade duration', async () => {
      await initFacade();

      const timelineProviders: Record<TimelineTypes, ITimelineProviderInfo> = {
        animation: {
          id: 'facade-provider',
          vendor: 'eligius',
          provider: facade,
        },
        mediaplayer: {
          id: 'mediaplayer-provider',
          vendor: 'eligius',
          provider: facade,
        },
      };

      const config = createMinimalConfig();
      engine = new EligiusEngine(
        config,
        eventbus,
        timelineProviders,
        languageManager
      );

      await engine.init();

      expect(facade.getDuration()).toBe(10);
    });

    test('given engine with facade, when getPosition called after seek, then returns updated position', async () => {
      await initFacade();

      const timelineProviders: Record<TimelineTypes, ITimelineProviderInfo> = {
        animation: {
          id: 'facade-provider',
          vendor: 'eligius',
          provider: facade,
        },
        mediaplayer: {
          id: 'mediaplayer-provider',
          vendor: 'eligius',
          provider: facade,
        },
      };

      const config = createMinimalConfig();
      engine = new EligiusEngine(
        config,
        eventbus,
        timelineProviders,
        languageManager
      );

      await engine.init();

      await facade.seek(5);
      expect(facade.getPosition()).toBe(5);
    });
  });

  describe('cleanup', () => {
    test('given engine with facade, when engine destroyed, then facade is destroyed', async () => {
      await initFacade();

      const timelineProviders: Record<TimelineTypes, ITimelineProviderInfo> = {
        animation: {
          id: 'facade-provider',
          vendor: 'eligius',
          provider: facade,
        },
        mediaplayer: {
          id: 'mediaplayer-provider',
          vendor: 'eligius',
          provider: facade,
        },
      };

      const config = createMinimalConfig();
      engine = new EligiusEngine(
        config,
        eventbus,
        timelineProviders,
        languageManager
      );

      await engine.init();

      const destroySpy = vi.spyOn(facade, 'destroy');

      await engine.destroy();

      expect(destroySpy).toHaveBeenCalled();
    });
  });
});
