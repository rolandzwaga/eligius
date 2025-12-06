import type {IEngineConfiguration} from '@configuration/types.ts';
import {beforeEach, describe, expect, type TestContext, test} from 'vitest';
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

  constructor(config: any, eventbus: any, provider: any, languageManager: any) {
    this.config = config;
    this.eventbus = eventbus;
    this.provider = provider;
    this.languageManager = languageManager;
  }

  on(_event: string, _handler: (...args: any[]) => void): () => void {
    return () => {};
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
});
