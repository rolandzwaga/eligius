import { expect } from 'chai';
import $ from 'jquery';
import sinon from 'sinon';
import { ChronoTriggerEngine } from '../../chrono-trigger-engine';

class LanguageManagerStub {
  constructor(
    public language: string,
    public labels: any[],
    public eventbus: any
  ) {}
}

describe('ChronoTriggerEngine', () => {
  let configuration: any;
  let eventbus: any;
  let providers: any;
  let languageManager: any;

  beforeEach(() => {
    configuration = {};
    eventbus = {};
    providers = {};
    languageManager = {};
    $('<div class="test"/>').appendTo(document.body);
  });

  afterEach(() => {
    $('.test').remove();
  });

  function setupLayoutInit() {
    configuration.layoutTemplate = '<div class="layout"/>';
    configuration.containerSelector = '.test';
  }

  function setupEventbus() {
    eventbus = {
      on: sinon.stub(),
    };
  }

  it('should create an engine', () => {
    // test
    const engine = new ChronoTriggerEngine(
      configuration,
      eventbus,
      providers,
      languageManager
    );

    // expect
    expect(engine).to.not.equal(null);
  });

  it('should create the layout template', () => {
    // given
    setupLayoutInit();

    const engine = new ChronoTriggerEngine(
      configuration,
      eventbus,
      providers,
      languageManager
    );

    // test
    engine._createLayoutTemplate();
    expect($('.layout').length).to.equal(1);
  });

  it('should throw an error when container selector cannot be resolved', () => {
    // given
    configuration.containerSelector = '.test_does_not_exist';
    let error = null;
    const engine = new ChronoTriggerEngine(
      configuration,
      eventbus,
      providers,
      languageManager
    );

    // test
    try {
      engine._createLayoutTemplate();
    } catch (e) {
      error = e;
    }

    // expect
    expect(error).to.not.equal(null);
    expect(error.message).to.equal(
      'Container selector not found: .test_does_not_exist'
    );
  });

  it('should initialize end duration to Infinity for timeline actions with an end value below zero', () => {
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
              end: -1,
            },
            start: () => {},
            end: () => {},
          },
          {
            name: 'testname2',
            duration: {
              start: 1,
              end: 10,
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
            return new Promise<void>(resolve => resolve());
          },
          on: () => {},
        },
      },
    };

    const engine = new ChronoTriggerEngine(
      configuration,
      eventbus,
      providers,
      languageManager
    );

    // test
    engine.init();

    // expect
    expect(configuration.timelines[0].timelineActions[0].duration.end).to.equal(
      Infinity
    );
    expect(configuration.timelines[0].timelineActions[1].duration.end).to.equal(
      10
    );
  });
});
