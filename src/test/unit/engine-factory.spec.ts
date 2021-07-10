import { expect } from 'chai';
import { IEngineConfiguration } from '../../configuration/types';
import { EngineFactory } from '../../engine-factory';

class MockImporter {
  import(name: string) {
    if (name === 'EligiusEngine') {
      return { EligiusEngine: MockEngine };
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

class MockTimelineProvider {}

describe('EngineFactory', () => {
  let windowRef = {};

  it('should create', () => {
    // given
    const importer = new MockImporter();

    // test
    const factory = new EngineFactory(importer as any, windowRef);

    // expect
    expect(factory).not.to.be.null;
  });

  it('should create the engine', () => {
    // given
    const importer = new MockImporter();
    const factory = new EngineFactory(importer as any, windowRef);

    const config: IEngineConfiguration = {
      id: 'testEngine',
      containerSelector: 'containerSelector',
      layoutTemplate: 'layoutTemplate',
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
