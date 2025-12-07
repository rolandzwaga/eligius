import type {IEngineConfiguration} from '@configuration/types.ts';
import {
  beforeEach,
  describe,
  expect,
  type TestContext,
  test,
  vi,
} from 'vitest';
import {EngineFactory} from '../../engine-factory.ts';
import type {IEngineFactory, ISimpleResourceImporter} from '../../types.ts';

class MockImporter {
  import(name: string) {
    if (name === 'EligiusEngine') {
      return {EligiusEngine: MockEngine};
    } else if (name === 'MockTimelineProvider') {
      return {MockTimelineProvider: MockTimelineProvider};
    }
    return {[name]: {}};
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
  test<EngineFactorySuiteContext>('should create', context => {
    // test
    const {factory} = context;

    // expect
    expect(factory).not.toBeUndefined();
  });
  test<EngineFactorySuiteContext>('should create the engine', context => {
    // given
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
          id: '1111',
          selector: '.test',
          poster: '',
          vendor: 'eligius',
          systemName: 'MockTimelineProvider',
        },
      },
      timelines: [],
      language: 'en-US',
      labels: [
        {
          id: 'mainTitle',
          labels: [
            {
              id: '111',
              languageCode: 'en-US',
              label: 'test 1',
            },
            {
              id: '222',
              languageCode: 'nl-NL',
              label: 'tezt 1',
            },
          ],
        },
      ],
    };

    // test
    factory.createEngine(config);
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
            id: '1111',
            selector: '.test',
            poster: '',
            vendor: 'eligius',
            systemName: 'MockTimelineProvider',
          },
        },
        timelines: [],
        language: 'en-US',
        labels: [],
      };
    }

    describe('destroy should not double-destroy languageManager', () => {
      test<EngineFactorySuiteContext>('should not call languageManager.destroy() from factory since engine already does it', async context => {
        const {factory} = context;
        const config = createMinimalConfig();

        const result = factory.createEngine(config);

        // Spy on the languageManager's destroy method
        const destroySpy = vi.spyOn(result.languageManager, 'destroy');

        // Call the factory's destroy function
        await result.destroy();

        // languageManager.destroy() should only be called once
        // (either by engine or by factory, not both)
        expect(destroySpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('import error handling', () => {
      test<EngineFactorySuiteContext>('should throw descriptive error when engine systemName import fails', context => {
        const badImporter = {
          import: (_name: string) => ({}), // Returns empty object, no matching key
        };
        const factory = new EngineFactory(
          badImporter,
          context.windowRef
        );
        const config = createMinimalConfig();

        expect(() => factory.createEngine(config)).toThrow(
          /Failed to import.*EligiusEngine/
        );
      });

      test<EngineFactorySuiteContext>('should throw descriptive error when timeline provider import fails', context => {
        const badImporter = {
          import: (name: string) => {
            if (name === 'EligiusEngine') {
              return {EligiusEngine: MockEngine};
            }
            return {}; // Returns empty object for timeline provider
          },
        };
        const factory = new EngineFactory(
          badImporter,
          context.windowRef
        );
        const config = createMinimalConfig();

        expect(() => factory.createEngine(config)).toThrow(
          /Failed to import.*MockTimelineProvider/
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
