import { expect } from 'chai';
import { EngineFactory } from '~/engine-factory';

class MockImporter {
  import(name) {
    if (name === 'ChronoTriggerEngine') {
      return { ChronoTriggerEngine: MockEngine };
    } else if (name === 'MockTimelineProvider') {
      return { MockTimelineProvider: MockTimelineProvider };
    }
    return { [name]: {} };
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
}

class MockEventbus {
  registerInterceptor(_name: any, _instance: any) {
    return {};
  }
}

class MockTimelineProvider {}

class ConfigurationResolverStub {
  process(_actionRegistryListener: any, _configuration: any) {}
}

describe('EngineFactory', () => {
  let windowRef = {};
  let resizer;

  it('should create', () => {
    // given
    const importer = new MockImporter();
    resizer = {
      resize: (handler: any) => {
        expect(handler).to.not.equal(null);
      },
    };

    // test
    const factory = new EngineFactory(importer as any, windowRef);

    // expect
    expect(factory).not.to.be.null;
  });

  it('should create the engine', () => {
    // given
    const importer = new MockImporter();
    const factory = new EngineFactory(importer as any, windowRef);

    const config = {
      engine: {
        systemName: 'ChronoTriggerEngine',
      },
      timelineProviderSettings: {
        animation: {
          vendor: 'chronotrigger',
          systemName: 'MockTimelineProvider',
        },
      },
      language: 'en-US',
      labels: [
        {
          id: 'mainTitle',
          labels: [
            {
              code: 'en-US',
              label: 'test 1',
            },
            {
              code: 'nl-NL',
              label: 'tezt 1',
            },
          ],
        },
      ],
    };

    // test
    factory.createEngine(config as any);
  });
});
