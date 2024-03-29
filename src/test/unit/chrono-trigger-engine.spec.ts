import { expect } from 'chai';
import $ from 'jquery';
import sinon from 'sinon';
import { suite } from 'uvu';
import { EligiusEngine } from '../../eligius-engine';
import { IEventbus } from '../../eventbus';

class LanguageManagerStub {
  constructor(
    public language: string,
    public labels: any[],
    public eventbus: any
  ) {}
}

interface SuiteContext {
  configuration: any;
  eventbus: IEventbus;
  providers: any;
  languageManager: any;
}

const EligiusEngineSuite = suite<SuiteContext>('EligiusEngine');

EligiusEngineSuite.before.each((context) => {
  context.configuration = {};
  context.eventbus = {} as unknown as IEventbus;
  context.providers = {};
  context.languageManager = {};
  $('<div class="test"/>').appendTo(document.body);
});

EligiusEngineSuite.after.each(() => {
  $('.test').remove();
});

function setupLayoutInit(context: SuiteContext) {
  context.configuration.layoutTemplate = '<div class="layout"/>';
  context.configuration.containerSelector = '.test';
}

function setupEventbus(context: SuiteContext) {
  context.eventbus = {
    on: sinon.stub(),
  } as unknown as IEventbus;
}

EligiusEngineSuite('should create an engine', (context) => {
  // test
  const engine = new EligiusEngine(
    context.configuration,
    context.eventbus,
    context.providers,
    context.languageManager
  );

  // expect
  expect(engine).to.not.equal(null);
});

EligiusEngineSuite('should create the layout template', (context) => {
  // given
  setupLayoutInit(context);

  const engine = new EligiusEngine(
    context.configuration,
    context.eventbus,
    context.providers,
    context.languageManager
  );

  // test
  (engine as any)._createLayoutTemplate();
  expect($('.layout').length).to.equal(1);
});

EligiusEngineSuite(
  'should throw an error when container selector cannot be resolved',
  (context) => {
    // given
    context.configuration.containerSelector = '.test_does_not_exist';
    let error: any = null;
    const engine = new EligiusEngine(
      context.configuration,
      context.eventbus,
      context.providers,
      context.languageManager
    );

    // test
    try {
      (engine as any)._createLayoutTemplate();
    } catch (e) {
      error = e;
    }

    // expect
    expect(error).to.not.equal(null);
    expect(error.message).to.equal(
      'Container selector not found: .test_does_not_exist'
    );
  }
);

EligiusEngineSuite(
  'should initialize end duration to Infinity for timeline actions with an end value below zero',
  (context) => {
    // given
    setupLayoutInit(context);
    setupEventbus(context);
    context.configuration.language = {};
    context.configuration.labels = {};
    context.configuration.timelines = [
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
    context.providers = {
      animation: {
        provider: {
          init: () => Promise.resolve(),
          on: () => {},
          onTime: () => {},
          onComplete: () => {},
          onFirstFrame: () => {},
          onRestart: () => {},
        },
      },
    };

    const engine = new EligiusEngine(
      context.configuration,
      context.eventbus,
      context.providers,
      context.languageManager
    );

    // test
    engine.init();

    // expect
    expect(
      context.configuration.timelines[0].timelineActions[0].duration.end
    ).to.equal(Infinity);
    expect(
      context.configuration.timelines[0].timelineActions[1].duration.end
    ).to.equal(10);
  }
);

EligiusEngineSuite.run();
