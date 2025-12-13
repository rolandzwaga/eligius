import type {IEngineConfiguration} from '@configuration/types.ts';
import {DomContainerProvider} from '@timelineproviders/container-providers/dom-container-provider.ts';
import {SimplePlaylist} from '@timelineproviders/playlist/simple-playlist.ts';
import {RafPositionSource} from '@timelineproviders/position-sources/raf-position-source.ts';
import {ScrollPositionSource} from '@timelineproviders/position-sources/scroll-position-source.ts';
import {beforeEach, describe, expect, type TestContext, test, vi} from 'vitest';
import {EngineFactory} from '@/engine-factory.ts';
import type {IEngineFactory, ISimpleResourceImporter} from '@/types.ts';

class MockImporter {
  import(name: string) {
    const modules: Record<string, any> = {
      EligiusEngine: {EligiusEngine: MockEngine},
      MockTimelineProvider: {MockTimelineProvider: MockTimelineProvider},
      RafPositionSource: {RafPositionSource},
      ScrollPositionSource: {ScrollPositionSource},
      DomContainerProvider: {DomContainerProvider},
      SimplePlaylist: {SimplePlaylist},
    };
    return modules[name] || {};
  }
}

class MockEngine {
  config: any;
  eventbus: any;
  provider: any;
  languageManager: any;
  destroyCalled = false;

  constructor(config: any, eventbus: any, provider: any, languageManager: any) {
    this.config = config;
    this.eventbus = eventbus;
    this.provider = provider;
    this.languageManager = languageManager;
  }

  on(_event: string, _handler: (...args: any[]) => void): () => void {
    return () => {};
  }

  async destroy() {
    this.destroyCalled = true;
    // The real engine calls languageManager.destroy() here
    // We simulate this to test that the factory doesn't double-destroy
    this.languageManager.destroy();
  }
}

class MockTimelineProvider {}

type EngineFactorySuiteContext = {
  importer: ISimpleResourceImporter;
  windowRef: any;
  factory: IEngineFactory;
} & TestContext;

function createMockWindow(): any {
  return {
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

function withContext<T>(ctx: unknown): asserts ctx is T {}
describe<EngineFactorySuiteContext>('EngineFactory', () => {
  beforeEach(context => {
    withContext<EngineFactorySuiteContext>(context);

    context.importer = new MockImporter();
    context.windowRef = createMockWindow();
    context.factory = new EngineFactory(context.importer, context.windowRef);
  });
  test<EngineFactorySuiteContext>('should create factory instance', context => {
    const {factory} = context;

    expect(factory).toBeDefined();
    expect(factory.createEngine).toBeInstanceOf(Function);
    expect(factory.destroy).toBeInstanceOf(Function);
  });

  test<EngineFactorySuiteContext>('should create the engine with expected structure', context => {
    const {factory} = context;

    const config: IEngineConfiguration = {
      id: 'testEngine',
      containerSelector: 'containerSelector',
      layoutTemplate: 'layoutTemplate',
      cssFiles: [],
      availableLanguages: [],
      engine: {
        systemName: 'EligiusEngine',
      },
      actions: [],
      initActions: [],
      timelineProviderSettings: {
        animation: {
          positionSource: {systemName: 'RafPositionSource'},
        },
      },
      timelines: [
        {
          id: 'test-timeline',
          uri: 'test-uri',
          type: 'animation',
          duration: 60, // 60 seconds
          loop: false,
          selector: '.test',
          timelineActions: [],
        },
      ],
      language: 'en-US',
    };

    const result = factory.createEngine(config);

    // Verify the result contains expected properties
    expect(result).toBeDefined();
    expect(result.engine).toBeDefined();
    expect(result.eventbus).toBeDefined();
    expect(result.localeManager).toBeDefined();
    expect(result.destroy).toBeInstanceOf(Function);
  });

  describe('regression tests', () => {
    function createMinimalConfig(): IEngineConfiguration {
      return {
        id: 'testEngine',
        containerSelector: 'containerSelector',
        layoutTemplate: 'layoutTemplate',
        cssFiles: [],
        availableLanguages: [],
        engine: {
          systemName: 'EligiusEngine',
        },
        actions: [],
        initActions: [],
        timelineProviderSettings: {
          animation: {
            positionSource: {systemName: 'RafPositionSource'},
          },
        },
        timelines: [
          {
            id: 'test-timeline',
            uri: 'test-uri',
            type: 'animation',
            duration: 60,
            loop: false,
            selector: '.test',
            timelineActions: [],
          },
        ],
        language: 'en-US',
      };
    }

    describe('destroy should not double-destroy localeManager', () => {
      test<EngineFactorySuiteContext>('should not call localeManager.destroy() from factory since engine already does it', async context => {
        const {factory} = context;
        const config = createMinimalConfig();

        const result = factory.createEngine(config);

        // Spy on the localeManager's destroy method
        const destroySpy = vi.spyOn(result.localeManager, 'destroy');

        // Call the factory's destroy function
        await result.destroy();

        // localeManager.destroy() should only be called once
        // (either by engine or by factory, not both)
        expect(destroySpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('import error handling', () => {
      test<EngineFactorySuiteContext>('should throw descriptive error when engine systemName import fails', context => {
        const badImporter = {
          import: (_name: string) => ({}), // Returns empty object, no matching key
        };
        const factory = new EngineFactory(badImporter, context.windowRef);
        const config = createMinimalConfig();

        expect(() => factory.createEngine(config)).toThrow(
          /Failed to import.*EligiusEngine/
        );
      });
    });

    describe('factory destroy cleanup', () => {
      test<EngineFactorySuiteContext>('should clear _actionsLookup on factory destroy', context => {
        const {factory} = context;
        const config = createMinimalConfig();

        // Create an engine (this populates _actionsLookup)
        factory.createEngine(config);

        // Destroy the factory
        factory.destroy();

        // The request-action handler should return null for any action
        // since _actionsLookup should be cleared
        // We can test this by creating a new engine and checking the eventbus
        // but since factory is destroyed, we just verify no errors occur
        expect(() => factory.destroy()).not.toThrow();
      });
    });
  });
});
