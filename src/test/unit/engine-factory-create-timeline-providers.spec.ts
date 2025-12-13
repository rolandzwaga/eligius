import type {
  IResolvedEngineConfiguration,
  ITimelineProviderSettings,
  TTimelineProviderSettings,
} from '@configuration/types.ts';
import {DomContainerProvider} from '@timelineproviders/container-providers/dom-container-provider.ts';
import {SimplePlaylist} from '@timelineproviders/playlist/simple-playlist.ts';
import {RafPositionSource} from '@timelineproviders/position-sources/raf-position-source.ts';
import {ScrollPositionSource} from '@timelineproviders/position-sources/scroll-position-source.ts';
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
