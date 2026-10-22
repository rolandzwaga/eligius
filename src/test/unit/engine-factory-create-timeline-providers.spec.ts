import type {
  IResolvedEngineConfiguration,
  IResolvedTimelineConfiguration,
  ITimelineProviderSettings,
  TTimelineProviderSettings,
} from '@configuration/types.ts';
import {DomContainerProvider} from '@timelineproviders/container-providers/dom-container-provider.ts';
import {SimplePlaylist} from '@timelineproviders/playlist/simple-playlist.ts';
import {RafPositionSource} from '@timelineproviders/position-sources/raf-position-source.ts';
import {ScrollPositionSource} from '@timelineproviders/position-sources/scroll-position-source.ts';
import {VideoPositionSource} from '@timelineproviders/position-sources/video-position-source.ts';
import {beforeEach, describe, expect, type TestContext, test, vi} from 'vitest';
import {EngineFactory} from '../../engine-factory.ts';

// ─────────────────────────────────────────────────────────────────────────────
// Mock setup
// ─────────────────────────────────────────────────────────────────────────────

function createMockImporter() {
  return {
    import: vi.fn((name: string) => {
      const modules: Record<string, any> = {
        RafPositionSource: {RafPositionSource},
        ScrollPositionSource: {ScrollPositionSource},
        VideoPositionSource: {VideoPositionSource},
        DomContainerProvider: {DomContainerProvider},
        SimplePlaylist: {SimplePlaylist},
        EligiusEngine: {EligiusEngine: vi.fn()},
      };
      return modules[name] || {};
    }),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────────

function createMockConfiguration(
  overrides: Partial<IResolvedEngineConfiguration> = {}
): IResolvedEngineConfiguration {
  return {
    id: 'test-config',
    engine: {systemName: 'EligiusEngine'},
    timelineProviderSettings: {},
    containerSelector: '#container',
    cssFiles: [],
    language: 'en-US',
    layoutTemplate: '<div></div>',
    availableLanguages: [],
    initActions: [],
    actions: [],
    timelines: [],
    ...overrides,
  };
}

function createProviderSettings(
  overrides: Partial<ITimelineProviderSettings> = {}
): ITimelineProviderSettings {
  return {
    positionSource: {systemName: 'RafPositionSource'},
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Context
// ─────────────────────────────────────────────────────────────────────────────

type FactoryTestContext = {
  factory: EngineFactory;
} & TestContext;

// ─────────────────────────────────────────────────────────────────────────────
// createTimelineProvidersForConfig Tests (new method)
// ─────────────────────────────────────────────────────────────────────────────

describe('EngineFactory.createTimelineProvidersForConfig', () => {
  beforeEach<FactoryTestContext>(context => {
    context.factory = new EngineFactory(createMockImporter() as any, window);
  });

  describe('with animation timeline type', () => {
    test<FactoryTestContext>('given config with animation settings and timeline, when created, then returns info with position source', ({
      factory,
    }) => {
      const config = createMockConfiguration({
        timelineProviderSettings: {
          animation: createProviderSettings({
            positionSource: {
              systemName: 'RafPositionSource',
              tickInterval: 1000,
            },
          }),
        },
        timelines: [
          {
            id: 'timeline-1',
            uri: '/animation.json',
            type: 'animation',
            duration: 60,
            loop: false,
            selector: '#animation',
            timelineActions: [],
          },
        ],
      });

      const result = factory.createTimelineProvidersForConfig(config);

      expect(result.animation).toBeDefined();
      expect(result.animation.positionSource).toBeInstanceOf(RafPositionSource);
      expect(result.animation.positionSource.getDuration()).toBe(60);
    });

    test<FactoryTestContext>('given config with animation settings and container, when created, then includes container provider', ({
      factory,
    }) => {
      const config = createMockConfiguration({
        timelineProviderSettings: {
          animation: createProviderSettings({
            positionSource: {systemName: 'RafPositionSource'},
            container: {
              systemName: 'DomContainerProvider',
              selector: '#render-area',
            },
          }),
        },
        timelines: [
          {
            id: 'timeline-1',
            uri: '/animation.json',
            type: 'animation',
            duration: 60,
            loop: false,
            selector: '#animation',
            timelineActions: [],
          },
        ],
      });

      const result = factory.createTimelineProvidersForConfig(config);

      expect(result.animation.containerProvider).toBeDefined();
      expect(typeof result.animation.containerProvider?.getContainer).toBe(
        'function'
      );
    });

    test<FactoryTestContext>('given config with animation settings and playlist, when created, then includes playlist', ({
      factory,
    }) => {
      const config = createMockConfiguration({
        timelineProviderSettings: {
          animation: createProviderSettings({
            positionSource: {systemName: 'RafPositionSource'},
            playlist: {
              systemName: 'SimplePlaylist',
              items: [{uri: '/a1.json'}, {uri: '/a2.json'}],
              identifierKey: 'uri',
            },
          }),
        },
        timelines: [
          {
            id: 'timeline-1',
            uri: '/animation.json',
            type: 'animation',
            duration: 60,
            loop: false,
            selector: '#animation',
            timelineActions: [],
          },
        ],
      });

      const result = factory.createTimelineProvidersForConfig(config);

      expect(result.animation.playlist).toBeDefined();
      expect(result.animation.playlist?.items).toHaveLength(2);
    });
  });

  describe('with scroll-based timeline', () => {
    test<FactoryTestContext>('given config with scroll position source, when created, then returns ScrollPositionSource', ({
      factory,
    }) => {
      const config = createMockConfiguration({
        timelineProviderSettings: {
          animation: createProviderSettings({
            positionSource: {
              systemName: 'ScrollPositionSource',
              selector: '#scrollable',
            },
          }),
        },
        timelines: [
          {
            id: 'timeline-1',
            uri: '/scroll-animation.json',
            type: 'animation',
            duration: 100,
            loop: false,
            selector: '#scroll-container',
            timelineActions: [],
          },
        ],
      });

      const result = factory.createTimelineProvidersForConfig(config);

      expect(result.animation.positionSource).toBeInstanceOf(
        ScrollPositionSource
      );
    });
  });

  describe('with multiple timeline types', () => {
    test<FactoryTestContext>('given config with animation and mediaplayer settings, when created, then returns both providers', ({
      factory,
    }) => {
      const config = createMockConfiguration({
        timelineProviderSettings: {
          animation: createProviderSettings({
            positionSource: {systemName: 'RafPositionSource'},
          }),
        },
        timelines: [
          {
            id: 'animation-timeline',
            uri: '/animation.json',
            type: 'animation',
            duration: 60,
            loop: false,
            selector: '#animation',
            timelineActions: [],
          },
        ],
      });

      const result = factory.createTimelineProvidersForConfig(config);

      expect(result.animation).toBeDefined();
      expect(Object.keys(result)).toContain('animation');
    });
  });

  describe('timeline type matching', () => {
    test<FactoryTestContext>('given config with multiple timelines of same type, when created, then uses first timeline for duration', ({
      factory,
    }) => {
      const config = createMockConfiguration({
        timelineProviderSettings: {
          animation: createProviderSettings({
            positionSource: {systemName: 'RafPositionSource'},
          }),
        },
        timelines: [
          {
            id: 'timeline-1',
            uri: '/animation1.json',
            type: 'animation',
            duration: 30,
            loop: false,
            selector: '#animation1',
            timelineActions: [],
          },
          {
            id: 'timeline-2',
            uri: '/animation2.json',
            type: 'animation',
            duration: 90,
            loop: false,
            selector: '#animation2',
            timelineActions: [],
          },
        ],
      });

      const result = factory.createTimelineProvidersForConfig(config);

      // Uses first timeline's duration
      expect(result.animation.positionSource.getDuration()).toBe(30);
    });
  });

  describe('error handling', () => {
    test<FactoryTestContext>('given settings without matching timeline, when created, then throws descriptive error', ({
      factory,
    }) => {
      const config = createMockConfiguration({
        timelineProviderSettings: {
          animation: createProviderSettings({
            positionSource: {systemName: 'RafPositionSource'},
          }),
        },
        timelines: [], // No timelines!
      });

      expect(() => factory.createTimelineProvidersForConfig(config)).toThrow(
        /no matching timeline/i
      );
    });

    test<FactoryTestContext>('given unknown position source systemName, when created, then throws error', ({
      factory,
    }) => {
      const config = createMockConfiguration({
        timelineProviderSettings: {
          animation: createProviderSettings({
            positionSource: {systemName: 'UnknownPositionSource'},
          }),
        },
        timelines: [
          {
            id: 'timeline-1',
            uri: '/animation.json',
            type: 'animation',
            duration: 60,
            loop: false,
            selector: '#animation',
            timelineActions: [],
          },
        ],
      });

      expect(() => factory.createTimelineProvidersForConfig(config)).toThrow(
        /UnknownPositionSource/i
      );
    });
  });

  describe('empty settings', () => {
    test<FactoryTestContext>('given config with no provider settings, when created, then returns empty record', ({
      factory,
    }) => {
      const config = createMockConfiguration({
        timelineProviderSettings: {},
        timelines: [],
      });

      const result = factory.createTimelineProvidersForConfig(config);

      expect(result).toEqual({});
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration with createEngine
// ─────────────────────────────────────────────────────────────────────────────

describe('EngineFactory.createEngine with new config format', () => {
  // These tests verify that createEngine works with the new config structure
  // Full integration testing will be done in Phase 3

  test('given new config format, when config is validated, then timelineProviderSettings has correct structure', () => {
    const settings: TTimelineProviderSettings = {
      animation: {
        positionSource: {systemName: 'RafPositionSource', tickInterval: 1000},
        container: {systemName: 'DomContainerProvider', selector: '#container'},
      },
    };

    // Type assertion verifies the structure is correct
    expect(settings.animation?.positionSource.systemName).toBe(
      'RafPositionSource'
    );
    expect(settings.animation?.container?.systemName).toBe(
      'DomContainerProvider'
    );
    expect(settings.animation?.container?.selector).toBe('#container');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createTimelineProvidersByUri Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('EngineFactory.createTimelineProvidersByUri', () => {
  beforeEach<FactoryTestContext>(context => {
    context.factory = new EngineFactory(createMockImporter() as any, window);
  });

  function animationTimeline(uri: string, duration: number) {
    return {
      id: uri,
      uri,
      type: 'animation' as const,
      duration,
      loop: false,
      selector: '#animation',
      timelineActions: [],
    };
  }

  test<FactoryTestContext>('given two animation timelines of 10s and 20s, when created, then each gets its own position source with its own duration', ({
    factory,
  }) => {
    const config = createMockConfiguration({
      timelineProviderSettings: {
        animation: createProviderSettings({
          container: {systemName: 'DomContainerProvider', selector: '#stage'},
        }),
      },
      timelines: [animationTimeline('t1', 10), animationTimeline('t2', 20)],
    });
    const byType = factory.createTimelineProvidersForConfig(config);

    const byUri = factory.createTimelineProvidersByUri(config, byType);

    expect(byUri.t1).toBe(byType.animation);
    expect(byUri.t2.positionSource).not.toBe(byType.animation.positionSource);
    expect(byUri.t1.positionSource.getDuration()).toBe(10);
    expect(byUri.t2.positionSource.getDuration()).toBe(20);
    expect(byUri.t2.containerProvider).toBe(byType.animation.containerProvider);
  });

  test<FactoryTestContext>('given a position source with its own container (like a video player), when created, then it is shared by all timelines of that type', ({
    factory,
  }) => {
    const config = createMockConfiguration({
      timelineProviderSettings: {animation: createProviderSettings()},
      timelines: [animationTimeline('t1', 10), animationTimeline('t2', 20)],
    });
    const playerLikeSource = Object.assign(
      new RafPositionSource({duration: 10}),
      {getContainer: vi.fn(), onContainerReady: vi.fn()}
    );
    const byType = {animation: {positionSource: playerLikeSource}} as any;

    const byUri = factory.createTimelineProvidersByUri(config, byType);

    expect(byUri.t1.positionSource).toBe(playerLikeSource);
    expect(byUri.t2.positionSource).toBe(playerLikeSource);
  });
});

describe('EngineFactory.createTimelineProvidersByUri with per-timeline overrides', () => {
  beforeEach<FactoryTestContext>(context => {
    context.factory = new EngineFactory(createMockImporter() as any, window);
  });

  function animationTimeline(
    uri: string,
    duration: number,
    overrides: Partial<IResolvedTimelineConfiguration> = {}
  ): IResolvedTimelineConfiguration {
    return {
      id: uri,
      uri,
      type: 'animation',
      duration,
      loop: false,
      selector: '#animation',
      timelineActions: [],
      ...overrides,
    };
  }

  function mediaTimeline(
    uri: string,
    overrides: Partial<IResolvedTimelineConfiguration> = {}
  ): IResolvedTimelineConfiguration {
    return {...animationTimeline(uri, 0), type: 'mediaplayer', ...overrides};
  }

  function createProviders(
    factory: EngineFactory,
    config: IResolvedEngineConfiguration
  ) {
    const byType = factory.createTimelineProvidersForConfig(config);
    return {
      byType,
      byUri: factory.createTimelineProvidersByUri(config, byType),
    };
  }

  const videoSettings: ITimelineProviderSettings = {
    positionSource: {
      systemName: 'VideoPositionSource',
      selector: '#video',
      sources: [{src: '/a.mp4', type: 'video/mp4'}],
    },
  };

  test<FactoryTestContext>('given a RAF type and a timeline overriding it with a ScrollPositionSource, when created, then that timeline gets a scroll source with its own duration and the type container', ({
    factory,
  }) => {
    const config = createMockConfiguration({
      timelineProviderSettings: {
        animation: createProviderSettings({
          container: {systemName: 'DomContainerProvider', selector: '#stage'},
        }),
      },
      timelines: [
        animationTimeline('intro', 10),
        animationTimeline('chapter', 30, {
          positionSource: {
            systemName: 'ScrollPositionSource',
            selector: '#chapter',
          },
        }),
      ],
    });

    const {byType, byUri} = createProviders(factory, config);

    expect(byUri.intro).toBe(byType.animation);
    expect(byUri.intro.positionSource).toBeInstanceOf(RafPositionSource);
    expect(byUri.chapter.positionSource).toBeInstanceOf(ScrollPositionSource);
    expect(byUri.chapter.positionSource.getDuration()).toBe(30);
    expect(byUri.chapter.containerProvider).toBe(
      byType.animation.containerProvider
    );
  });

  test<FactoryTestContext>('given the first timeline of a type overrides its source, when created, then the type provider is built for the first timeline that does not', ({
    factory,
  }) => {
    const config = createMockConfiguration({
      timelineProviderSettings: {animation: createProviderSettings()},
      timelines: [
        animationTimeline('scrolled', 30, {
          positionSource: {systemName: 'ScrollPositionSource', selector: '#a'},
        }),
        animationTimeline('clocked', 12),
      ],
    });

    const {byType, byUri} = createProviders(factory, config);

    expect(byType.animation.positionSource.getDuration()).toBe(12);
    expect(byUri.clocked).toBe(byType.animation);
    expect(byUri.scrolled.positionSource).toBeInstanceOf(ScrollPositionSource);
  });

  test<FactoryTestContext>('given a scroll type and an override of only the selector, when created, then the other type settings are kept', ({
    factory,
  }) => {
    const importer = createMockImporter();
    const scrollClass = vi.fn(function (this: any, config: any) {
      this.config = config;
      this.getDuration = () => config.duration;
    });
    const real = importer.import.getMockImplementation()!;
    importer.import.mockImplementation((name: string) =>
      name === 'ScrollPositionSource'
        ? {ScrollPositionSource: scrollClass}
        : real(name)
    );
    factory = new EngineFactory(importer as any, window);
    const config = createMockConfiguration({
      timelineProviderSettings: {
        animation: createProviderSettings({
          positionSource: {
            systemName: 'ScrollPositionSource',
            selector: '#a',
            custom: 'kept',
          },
        }),
      },
      timelines: [
        animationTimeline('one', 10),
        animationTimeline('two', 20, {positionSource: {selector: '#b'}}),
      ],
    });

    createProviders(factory, config);

    expect(scrollClass).toHaveBeenCalledTimes(2);
    expect(scrollClass).toHaveBeenLastCalledWith({
      selector: '#b',
      custom: 'kept',
      duration: 20,
    });
  });

  test<FactoryTestContext>('given an override that repeats the type settings, when created, then the timeline is treated like one without an override', ({
    factory,
  }) => {
    const config = createMockConfiguration({
      timelineProviderSettings: {animation: createProviderSettings()},
      timelines: [
        animationTimeline('one', 10, {
          positionSource: {systemName: 'RafPositionSource'},
        }),
      ],
    });

    const {byType, byUri} = createProviders(factory, config);

    expect(byUri.one).toBe(byType.animation);
  });

  test<FactoryTestContext>('given two mediaplayer timelines without overrides, when created, then they share one video source', ({
    factory,
  }) => {
    const config = createMockConfiguration({
      timelineProviderSettings: {mediaplayer: videoSettings},
      timelines: [mediaTimeline('v1'), mediaTimeline('v2')],
    });

    const {byUri} = createProviders(factory, config);

    expect(byUri.v1.positionSource).toBeInstanceOf(VideoPositionSource);
    expect(byUri.v2.positionSource).toBe(byUri.v1.positionSource);
  });

  test<FactoryTestContext>('given a mediaplayer timeline whose override changes the video sources, when created, then it gets a video source of its own', ({
    factory,
  }) => {
    const config = createMockConfiguration({
      timelineProviderSettings: {mediaplayer: videoSettings},
      timelines: [
        mediaTimeline('v1'),
        mediaTimeline('v2', {
          positionSource: {sources: [{src: '/b.mp4', type: 'video/mp4'}]},
        }),
      ],
    });

    const {byUri} = createProviders(factory, config);

    expect(byUri.v2.positionSource).toBeInstanceOf(VideoPositionSource);
    expect(byUri.v2.positionSource).not.toBe(byUri.v1.positionSource);
  });

  test<FactoryTestContext>('given two mediaplayer timelines with the same video override, when created, then they share one video source of their own', ({
    factory,
  }) => {
    const sameOverride = () => ({
      positionSource: {sources: [{src: '/b.mp4', type: 'video/mp4'}]},
    });
    const config = createMockConfiguration({
      timelineProviderSettings: {mediaplayer: videoSettings},
      timelines: [
        mediaTimeline('v1'),
        mediaTimeline('v2', sameOverride()),
        mediaTimeline('v3', sameOverride()),
      ],
    });

    const {byUri} = createProviders(factory, config);

    expect(byUri.v3.positionSource).toBe(byUri.v2.positionSource);
    expect(byUri.v2.positionSource).not.toBe(byUri.v1.positionSource);
  });

  test<FactoryTestContext>('given an override that repeats the video settings, when created, then the shared video source is used', ({
    factory,
  }) => {
    const config = createMockConfiguration({
      timelineProviderSettings: {mediaplayer: videoSettings},
      timelines: [
        mediaTimeline('v1'),
        mediaTimeline('v2', {positionSource: {selector: '#video'}}),
      ],
    });

    const {byUri} = createProviders(factory, config);

    expect(byUri.v2.positionSource).toBe(byUri.v1.positionSource);
  });

  test<FactoryTestContext>('given a timeline type without provider settings and an override naming its source, when created, then the timeline gets that source without container or playlist', ({
    factory,
  }) => {
    const config = createMockConfiguration({
      timelineProviderSettings: {animation: createProviderSettings()},
      timelines: [
        animationTimeline('intro', 10),
        mediaTimeline('clock', {
          duration: 15,
          positionSource: {systemName: 'RafPositionSource'},
        }),
      ],
    });

    const {byType, byUri} = createProviders(factory, config);

    expect(byType.mediaplayer).toBeUndefined();
    expect(byUri.clock.positionSource).toBeInstanceOf(RafPositionSource);
    expect(byUri.clock.positionSource.getDuration()).toBe(15);
    expect(byUri.clock.containerProvider).toBeUndefined();
    expect(byUri.clock.playlist).toBeUndefined();
  });

  test<FactoryTestContext>('given an override without systemName and no type settings, when created, then it throws naming the timeline', ({
    factory,
  }) => {
    const config = createMockConfiguration({
      timelines: [mediaTimeline('clock', {positionSource: {selector: '#a'}})],
    });

    expect(() => createProviders(factory, config)).toThrowError(
      "Timeline 'clock' has a positionSource override without a systemName, and there are no timelineProviderSettings.mediaplayer to merge it over."
    );
  });

  test<FactoryTestContext>('given containerProvider overrides, when created, then timelines with the same merged settings share one container provider and the type default stays shared', ({
    factory,
  }) => {
    const config = createMockConfiguration({
      timelineProviderSettings: {
        animation: createProviderSettings({
          container: {systemName: 'DomContainerProvider', selector: '#stage'},
          playlist: {
            systemName: 'SimplePlaylist',
            items: [{uri: 'a'}, {uri: 'b'}, {uri: 'c'}],
            identifierKey: 'uri',
          },
        }),
      },
      timelines: [
        animationTimeline('a', 10),
        animationTimeline('b', 10, {containerProvider: {selector: '#other'}}),
        animationTimeline('c', 10, {containerProvider: {selector: '#other'}}),
      ],
    });

    const {byType, byUri} = createProviders(factory, config);

    expect(byUri.a.containerProvider).toBe(byType.animation.containerProvider);
    expect(byUri.b.containerProvider).toBeInstanceOf(DomContainerProvider);
    expect(byUri.b.containerProvider).not.toBe(
      byType.animation.containerProvider
    );
    expect(byUri.c.containerProvider).toBe(byUri.b.containerProvider);
    expect(byUri.b.playlist).toBe(byType.animation.playlist);
    // b and c only override the container: each still has its own clock
    expect(byUri.b.positionSource).toBeInstanceOf(RafPositionSource);
    expect(byUri.b.positionSource).not.toBe(byUri.a.positionSource);
    expect(byUri.c.positionSource).not.toBe(byUri.b.positionSource);
  });

  test<FactoryTestContext>('given the representative timeline only overrides its container, when created, then it keeps the type position source with its own container', ({
    factory,
  }) => {
    const config = createMockConfiguration({
      timelineProviderSettings: {
        animation: createProviderSettings({
          container: {systemName: 'DomContainerProvider', selector: '#stage'},
        }),
      },
      timelines: [
        animationTimeline('a', 10, {containerProvider: {selector: '#other'}}),
      ],
    });

    const {byType, byUri} = createProviders(factory, config);

    expect(byUri.a.positionSource).toBe(byType.animation.positionSource);
    expect(byUri.a.containerProvider).not.toBe(
      byType.animation.containerProvider
    );
  });
});
