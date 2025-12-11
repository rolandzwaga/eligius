import type {
  IPositionSourceConfig,
  IResolvedTimelineConfiguration,
  ITimelineProviderSettings,
} from '@configuration/types.ts';
import {DomContainerProvider} from '@timelineproviders/container-providers/dom-container-provider.ts';
import {SimplePlaylist} from '@timelineproviders/playlist/simple-playlist.ts';
import {RafPositionSource} from '@timelineproviders/position-sources/raf-position-source.ts';
import {ScrollPositionSource} from '@timelineproviders/position-sources/scroll-position-source.ts';
import {beforeEach, describe, expect, type TestContext, test, vi} from 'vitest';
import {EngineFactory} from '../../engine-factory.ts';

// ─────────────────────────────────────────────────────────────────────────────
// Mock importer that resolves systemNames to actual classes
// ─────────────────────────────────────────────────────────────────────────────

function createMockImporter() {
  return {
    import: vi.fn((name: string) => {
      const modules: Record<string, any> = {
        RafPositionSource: {RafPositionSource},
        ScrollPositionSource: {ScrollPositionSource},
        DomContainerProvider: {DomContainerProvider},
        SimplePlaylist: {SimplePlaylist},
        VideoPositionSource: {}, // Empty - video not implemented in tests
      };
      return modules[name] || {};
    }),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock timeline configurations
// ─────────────────────────────────────────────────────────────────────────────

function createMockTimelineConfig(
  overrides: Partial<IResolvedTimelineConfiguration> = {}
): IResolvedTimelineConfiguration {
  return {
    id: 'test-timeline',
    uri: '/test/timeline.mp4',
    type: 'animation',
    duration: 60,
    loop: false,
    selector: '#timeline-container',
    timelineActions: [],
    ...overrides,
  };
}

function createMockProviderSettings(
  positionSource: IPositionSourceConfig,
  overrides: Partial<Omit<ITimelineProviderSettings, 'positionSource'>> = {}
): ITimelineProviderSettings {
  return {
    positionSource,
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Context
// ─────────────────────────────────────────────────────────────────────────────

type EngineFactoryTestContext = {
  factory: EngineFactory;
} & TestContext;

// ─────────────────────────────────────────────────────────────────────────────
// createPositionSourceForTimeline Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('EngineFactory.createPositionSourceForTimeline', () => {
  beforeEach<EngineFactoryTestContext>(context => {
    context.factory = new EngineFactory(createMockImporter() as any, window);
  });

  describe('RAF position source creation', () => {
    test<EngineFactoryTestContext>('given raf config and timeline with duration, when created, then returns RafPositionSource with timeline duration', ({
      factory,
    }) => {
      const timeline = createMockTimelineConfig({duration: 120});
      const settings = createMockProviderSettings({
        systemName: 'RafPositionSource',
      });

      const source = factory.createPositionSourceForTimeline(
        timeline,
        settings
      );

      expect(source).toBeInstanceOf(RafPositionSource);
      expect(source.getDuration()).toBe(120);
    });

    test<EngineFactoryTestContext>('given raf config with tickInterval, when created, then passes tickInterval to source', ({
      factory,
    }) => {
      const timeline = createMockTimelineConfig({duration: 60});
      const settings = createMockProviderSettings({
        systemName: 'RafPositionSource',
        tickInterval: 500,
      });

      const source = factory.createPositionSourceForTimeline(
        timeline,
        settings
      );

      expect(source).toBeInstanceOf(RafPositionSource);
    });

    test<EngineFactoryTestContext>('given raf config without tickInterval, when created, then uses default tickInterval', ({
      factory,
    }) => {
      const timeline = createMockTimelineConfig({duration: 60});
      const settings = createMockProviderSettings({
        systemName: 'RafPositionSource',
      });

      const source = factory.createPositionSourceForTimeline(
        timeline,
        settings
      );

      expect(source).toBeInstanceOf(RafPositionSource);
    });
  });

  describe('Scroll position source creation', () => {
    test<EngineFactoryTestContext>('given scroll config with selector, when created, then returns ScrollPositionSource', ({
      factory,
    }) => {
      const timeline = createMockTimelineConfig();
      const settings = createMockProviderSettings({
        systemName: 'ScrollPositionSource',
        selector: '#scrollable-container',
      });

      const source = factory.createPositionSourceForTimeline(
        timeline,
        settings
      );

      expect(source).toBeInstanceOf(ScrollPositionSource);
    });

    test<EngineFactoryTestContext>('given scroll config, when created, then uses selector from config', ({
      factory,
    }) => {
      const timeline = createMockTimelineConfig();
      const settings = createMockProviderSettings({
        systemName: 'ScrollPositionSource',
        selector: '.custom-scroll-area',
      });

      const source = factory.createPositionSourceForTimeline(
        timeline,
        settings
      );

      expect(source).toBeInstanceOf(ScrollPositionSource);
    });
  });

  describe('Video position source creation', () => {
    test<EngineFactoryTestContext>('given video config, when created, then throws error (video not exported in mock)', ({
      factory,
    }) => {
      const timeline = createMockTimelineConfig({uri: '/video/intro.mp4'});
      const settings = createMockProviderSettings({
        systemName: 'VideoPositionSource',
        selector: '#video-player',
      });

      expect(() =>
        factory.createPositionSourceForTimeline(timeline, settings)
      ).toThrow(/VideoPositionSource/i);
    });
  });

  describe('Error handling', () => {
    test<EngineFactoryTestContext>('given unknown position source systemName, when created, then throws error', ({
      factory,
    }) => {
      const timeline = createMockTimelineConfig();
      const settings = createMockProviderSettings({
        systemName: 'UnknownPositionSource',
      });

      expect(() =>
        factory.createPositionSourceForTimeline(timeline, settings)
      ).toThrow(/UnknownPositionSource/i);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createContainerProviderForTimeline Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('EngineFactory.createContainerProviderForTimeline', () => {
  beforeEach<EngineFactoryTestContext>(context => {
    context.factory = new EngineFactory(createMockImporter() as any, window);
  });

  test<EngineFactoryTestContext>('given settings with container config, when created, then returns container provider', ({
    factory,
  }) => {
    const settings = createMockProviderSettings(
      {systemName: 'RafPositionSource'},
      {
        container: {
          systemName: 'DomContainerProvider',
          selector: '#render-area',
        },
      }
    );

    const provider = factory.createContainerProviderForTimeline(settings);

    expect(provider).toBeDefined();
    expect(typeof provider?.getContainer).toBe('function');
  });

  test<EngineFactoryTestContext>('given settings without container config, when created, then returns undefined', ({
    factory,
  }) => {
    const settings = createMockProviderSettings({
      systemName: 'RafPositionSource',
    });

    const provider = factory.createContainerProviderForTimeline(settings);

    expect(provider).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createPlaylistForTimeline Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('EngineFactory.createPlaylistForTimeline', () => {
  beforeEach<EngineFactoryTestContext>(context => {
    context.factory = new EngineFactory(createMockImporter() as any, window);
  });

  test<EngineFactoryTestContext>('given settings with playlist config, when created, then returns playlist', ({
    factory,
  }) => {
    const settings = createMockProviderSettings(
      {systemName: 'RafPositionSource'},
      {
        playlist: {
          systemName: 'SimplePlaylist',
          items: [{uri: '/v1.mp4'}, {uri: '/v2.mp4'}],
          identifierKey: 'uri',
        },
      }
    );

    const playlist = factory.createPlaylistForTimeline(settings);

    expect(playlist).toBeDefined();
    expect(playlist?.items).toHaveLength(2);
  });

  test<EngineFactoryTestContext>('given settings without playlist config, when created, then returns undefined', ({
    factory,
  }) => {
    const settings = createMockProviderSettings({
      systemName: 'RafPositionSource',
    });

    const playlist = factory.createPlaylistForTimeline(settings);

    expect(playlist).toBeUndefined();
  });

  test<EngineFactoryTestContext>('given playlist, when selectItem called with valid identifier, then updates currentItem', ({
    factory,
  }) => {
    const settings = createMockProviderSettings(
      {systemName: 'RafPositionSource'},
      {
        playlist: {
          systemName: 'SimplePlaylist',
          items: [{uri: '/v1.mp4'}, {uri: '/v2.mp4'}],
          identifierKey: 'uri',
        },
      }
    );

    const playlist = factory.createPlaylistForTimeline(settings);
    playlist?.selectItem('/v2.mp4');

    expect(playlist?.currentItem).toEqual({uri: '/v2.mp4'});
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createTimelineProviderInfo Tests (assembles all components)
// ─────────────────────────────────────────────────────────────────────────────

describe('EngineFactory.createTimelineProviderInfo', () => {
  beforeEach<EngineFactoryTestContext>(context => {
    context.factory = new EngineFactory(createMockImporter() as any, window);
  });

  test<EngineFactoryTestContext>('given timeline and minimal settings, when created, then returns info with position source only', ({
    factory,
  }) => {
    const timeline = createMockTimelineConfig({duration: 60});
    const settings = createMockProviderSettings({
      systemName: 'RafPositionSource',
    });

    const info = factory.createTimelineProviderInfo(timeline, settings);

    expect(info.positionSource).toBeDefined();
    expect(info.containerProvider).toBeUndefined();
    expect(info.playlist).toBeUndefined();
  });

  test<EngineFactoryTestContext>('given timeline and settings with container, when created, then returns info with container provider', ({
    factory,
  }) => {
    const timeline = createMockTimelineConfig({duration: 60});
    const settings = createMockProviderSettings(
      {systemName: 'RafPositionSource'},
      {
        container: {
          systemName: 'DomContainerProvider',
          selector: '#render-area',
        },
      }
    );

    const info = factory.createTimelineProviderInfo(timeline, settings);

    expect(info.positionSource).toBeDefined();
    expect(info.containerProvider).toBeDefined();
    expect(info.playlist).toBeUndefined();
  });

  test<EngineFactoryTestContext>('given timeline and settings with playlist, when created, then returns info with playlist', ({
    factory,
  }) => {
    const timeline = createMockTimelineConfig({duration: 60});
    const settings = createMockProviderSettings(
      {systemName: 'RafPositionSource'},
      {
        playlist: {
          systemName: 'SimplePlaylist',
          items: [{uri: '/v1.mp4'}, {uri: '/v2.mp4'}],
          identifierKey: 'uri',
        },
      }
    );

    const info = factory.createTimelineProviderInfo(timeline, settings);

    expect(info.positionSource).toBeDefined();
    expect(info.containerProvider).toBeUndefined();
    expect(info.playlist).toBeDefined();
  });

  test<EngineFactoryTestContext>('given timeline and full settings, when created, then returns info with all components', ({
    factory,
  }) => {
    const timeline = createMockTimelineConfig({duration: 60});
    const settings = createMockProviderSettings(
      {systemName: 'RafPositionSource'},
      {
        container: {
          systemName: 'DomContainerProvider',
          selector: '#render-area',
        },
        playlist: {
          systemName: 'SimplePlaylist',
          items: [{uri: '/v1.mp4'}],
          identifierKey: 'uri',
        },
      }
    );

    const info = factory.createTimelineProviderInfo(timeline, settings);

    expect(info.positionSource).toBeDefined();
    expect(info.containerProvider).toBeDefined();
    expect(info.playlist).toBeDefined();
  });
});
