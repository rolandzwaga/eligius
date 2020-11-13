import { expect } from 'chai';
import sinon from 'sinon';
import { ChronoTriggerEngine } from '~/chrono-trigger-engine';

class LanguageManagerStub {
  constructor(public language: string, public labels: any[], public eventbus: any) {}
}

describe('ChronoTriggerEngine', () => {
  let fakeContainer: any;
  let configuration: any;
  let eventbus: any;
  let providers: any;
  let languageManager: any;

  beforeEach(() => {
    fakeContainer = null;
    configuration = {};
    eventbus = {};
    providers = {};
    languageManager = {};
  });

  function jQueryStub(_selector: string) {
    return fakeContainer;
  }

  function setupLayoutInit() {
    configuration.layoutTemplate = '<div/>';
    configuration.containerSelector = '.test';

    fakeContainer = {
      html: sinon.stub().withArgs(configuration.layoutTemplate),
      length: 1,
    };
  }

  function setupEventbus() {
    eventbus = {
      on: sinon.stub(),
    };
  }

  it('should create an engine', () => {
    // test
    const engine = new ChronoTriggerEngine(configuration, eventbus, providers, languageManager);

    // expect
    expect(engine).to.not.equal(null);
  });

  it('should create the layout template', () => {
    // given
    setupLayoutInit();

    const engine = new ChronoTriggerEngine(configuration, eventbus, providers, languageManager);

    // test
    engine._createLayoutTemplate();
  });

  it('should throw an error when container selector cannot be resolved', () => {
    // given
    configuration.containerSelector = '.test';
    let error = null;
    const engine = new ChronoTriggerEngine(configuration, eventbus, providers, languageManager);

    // test
    try {
      engine._createLayoutTemplate();
    } catch (e) {
      error = e;
    }

    // expect
    expect(error).to.not.equal(null);
    expect(error.message).to.equal('Container selector not found: .test');
  });

  it('should initialize end duration to Infinity for timeline actions without an end value', () => {
    // given
    setupLayoutInit();
    setupEventbus();
    configuration.language = {};
    configuration.labels = {};
    configuration.timelines = [
      {
        type: 'animation',
        uri: 'animation-01',
        loop: false,
        timelineActions: [
          {
            name: 'testname',
            duration: {
              start: 1,
            },
            start: () => {},
            end: () => {},
          },
        ],
      },
    ];
    providers = {
      animation: {
        provider: {
          init: () => {
            return new Promise((resolve) => resolve());
          },
          on: () => {},
        },
      },
    };

    const engine = new ChronoTriggerEngine(configuration, eventbus, providers, languageManager);

    // test
    engine.init();

    // expect
    expect(configuration.timelines[0].timelineActions[0].duration.end).to.equal(Infinity);
  });
});
