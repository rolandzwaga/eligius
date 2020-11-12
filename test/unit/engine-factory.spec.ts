import { expect } from 'chai';
const inject = require('inject-loader!~/engine-factory');

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

  constructor(config, eventbus, provider, languageManager) {
    this.config = config;
    this.eventbus = eventbus;
    this.provider = provider;
    this.languageManager = languageManager;
  }
}

class MockEventbus {
  registerInterceptor(_name, _instance) {
    return {};
  }
}

class MockTimelineProvider {}

class ConfigurationResolverStub {
  process(_actionRegistryListener, _configuration) {}
}

describe('EngineFactory', () => {
  let EngineFactory;
  let windowRef = {};
  let resizer;

  beforeEach(() => {
    EngineFactory = null;

    EngineFactory = inject({
      jquery: jQueryStub,
      './configuration/configuration-resolver': ConfigurationResolverStub,
      mousetrap: {
        bind: () => {},
      },
    }).EngineFactory;
  });

  function jQueryStub(windowInst) {
    expect(windowInst).to.equal(windowRef);
    return resizer;
  }

  it('should create', () => {
    // given
    const importer = new MockImporter();
    resizer = {
      resize: (handler) => {
        expect(handler).to.not.equal(null);
      },
    };

    // test
    const factory = new EngineFactory(importer, windowRef);

    // expect
    expect(factory).not.to.be.null;
  });

  it('should create the engine', () => {
    // given
    const importer = new MockImporter();
    const factory = new EngineFactory(importer, windowRef);

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
    factory.createEngine(config);
  });
});
