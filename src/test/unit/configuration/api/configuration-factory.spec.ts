import { expect } from 'chai';
import { suite } from 'uvu';
import {
  ActionEditor,
  EndableActionEditor,
  TimelineActionEditor,
} from '../../../../configuration/api/action-editor.ts';
import { ConfigurationFactory } from '../../../../configuration/api/configuration-factory.ts';
import { TimelineProvidersSettingsEditor } from '../../../../configuration/api/timeline-provider-settings-editor.ts';
import type {
  IActionConfiguration,
  ITimelineActionConfiguration,
} from '../../../../configuration/types.ts';

const ConfigurationFactorySuite = suite<{
  configurationFactory: ConfigurationFactory;
}>('ConfigurationFactory');

ConfigurationFactorySuite.before.each((context) => {
  context.configurationFactory = new ConfigurationFactory();
});

ConfigurationFactorySuite('should initialize a config', (context) => {
  //given
  const { configurationFactory } = context;
  // test
  configurationFactory.init('nl-NL');

  // expect
  const { configuration } = configurationFactory;
  expect(configuration.id).not.to.be.undefined;
  expect(configuration.engine.systemName).to.equal('EligiusEngine');
  expect(configuration.containerSelector).to.equal('[data-ct-container=true]');
  expect(configuration.timelineProviderSettings).to.deep.equal({});
  expect(configuration.language).to.equal('nl-NL');
  expect(configuration.availableLanguages.length).to.equal(0);
});

ConfigurationFactorySuite('should set the container selector', (context) => {
  // given
  const { configurationFactory } = context;
  configurationFactory.init('nl-NL');
  const selector = 'selector';

  // test
  configurationFactory.setContainerSelector(selector);

  // expect
  const { configuration } = configurationFactory;
  expect(configuration.containerSelector).to.equal(selector);
});

ConfigurationFactorySuite('should set the default language', (context) => {
  // given
  const { configurationFactory } = context;
  configurationFactory.init('nl-NL');
  const language = 'en-US';

  // test
  configurationFactory.setDefaultLanguage(language);

  // expect
  const { configuration } = configurationFactory;
  expect(configuration.language).to.equal(language);
});

ConfigurationFactorySuite(
  'should return a timeline provider editor',
  (context) => {
    // given
    const { configurationFactory } = context;
    configurationFactory.init('nl-NL');

    // test
    const editor = configurationFactory.editTimelineProviderSettings();

    // expect
    expect(editor).to.be.an.instanceOf(TimelineProvidersSettingsEditor);
  }
);

ConfigurationFactorySuite('should add the given language', (context) => {
  // given
  const { configurationFactory } = context;
  configurationFactory.init('nl-NL');

  // test
  configurationFactory.addLanguage('en-US', 'English');

  // expect
  const { configuration } = configurationFactory;
  expect(configuration.availableLanguages.length).to.equal(1);
  const lang = configuration.availableLanguages[0];
  expect(lang.languageCode).to.equal('en-US');
  expect(lang.label).to.equal('English');
});

ConfigurationFactorySuite(
  'addAction should add the specified action',
  (context) => {
    // given
    const { configurationFactory } = context;
    configurationFactory.init('nl-NL');
    const action = {} as IActionConfiguration;

    // test
    configurationFactory.addAction(action);

    // expect
    const { configuration } = configurationFactory;
    expect(configuration.actions.length).to.equal(1);
    expect(configuration.actions[0]).to.equal(action);
  }
);

ConfigurationFactorySuite(
  'addInitAction should add the specified initAction',
  (context) => {
    // given
    const { configurationFactory } = context;
    configurationFactory.init('nl-NL');
    const action = {} as IActionConfiguration;

    // test
    configurationFactory.addInitAction(action);

    // expect
    const { configuration } = configurationFactory;
    expect(configuration.initActions.length).to.equal(1);
    expect(configuration.initActions[0]).to.equal(action);
  }
);

ConfigurationFactorySuite(
  'addEventAction should add the specified eventAction',
  (context) => {
    // given
    const { configurationFactory } = context;
    configurationFactory.init('nl-NL');
    const action = {} as IActionConfiguration;

    // test
    configurationFactory.addEventAction(action);

    // expect
    const { configuration } = configurationFactory;
    expect(configuration.eventActions?.length).to.equal(1);
    expect(configuration.eventActions?.[0]).to.equal(action);
  }
);

ConfigurationFactorySuite(
  'addTimelineAction should throw error when timeline is not found for given uri',
  (context) => {
    // given
    const { configurationFactory } = context;
    configurationFactory.init('nl-NL');

    // expect
    expect(() =>
      configurationFactory.addTimelineAction(
        'test',
        {} as ITimelineActionConfiguration
      )
    ).throws("No timeline found for uri 'test'");
  }
);

ConfigurationFactorySuite(
  'addTimeline should add the specified timeline',
  (context) => {
    // given
    const { configurationFactory } = context;
    configurationFactory.init('nl-NL');

    // test
    configurationFactory.addTimeline(
      'test',
      'animation',
      100,
      false,
      'selector'
    );

    // expect
    const timeline = configurationFactory.getTimeline('test');
    expect(timeline).not.to.be.null;
    expect(timeline?.uri).to.equal('test');
    expect(timeline?.type).to.equal('animation');
    expect(timeline?.duration).to.equal(100);
    expect(timeline?.loop).to.be.false;
    expect(timeline?.selector).to.equal('selector');
  }
);

ConfigurationFactorySuite(
  'addTimeline should throw an error when a timeline with the given uri already exists',
  (context) => {
    // given
    const { configurationFactory } = context;
    configurationFactory.init('nl-NL');
    configurationFactory.addTimeline(
      'test',
      'animation',
      100,
      false,
      'selector'
    );

    // expect
    expect(() =>
      configurationFactory.addTimeline(
        'test',
        'animation',
        100,
        false,
        'selector'
      )
    ).throws('timeline for uri test already exists');
  }
);

ConfigurationFactorySuite(
  'addTimelineAction should add the specified action',
  (context) => {
    // given
    const { configurationFactory } = context;
    configurationFactory.init('nl-NL');
    configurationFactory.addTimeline(
      'test',
      'animation',
      100,
      false,
      'selector'
    );
    const action = {};

    // test
    configurationFactory.addTimelineAction(
      'test',
      action as ITimelineActionConfiguration
    );

    // expect
    const timeline = configurationFactory.getTimeline('test');
    expect(timeline?.timelineActions.length).to.equal(1);
    expect(timeline?.timelineActions[0]).to.equal(action);
  }
);

ConfigurationFactorySuite(
  'removeTimeline should remove the timeline for the given uri',
  (context) => {
    // given
    const { configurationFactory } = context;
    configurationFactory.init('nl-NL');
    configurationFactory.addTimeline(
      'test',
      'animation',
      100,
      false,
      'selector'
    );

    // test
    configurationFactory.removeTimeline('test');

    // expect
    const { configuration } = configurationFactory;
    expect(configuration.timelines.length).to.equal(0);
  }
);

ConfigurationFactorySuite('addLabel should add given label info', (context) => {
  // given
  const { configurationFactory } = context;
  configurationFactory.init('nl-NL');

  // test
  configurationFactory.addLabel('test', 'nl-NL', 'dit is een test');

  // expect
  const { configuration } = configurationFactory;
  expect(configuration.labels.length).to.equal(1);
  expect(configuration.labels[0].id).to.equal('test');
  expect(configuration.labels[0].labels[0].languageCode).to.equal('nl-NL');
  expect(configuration.labels[0].labels[0].label).to.equal('dit is een test');
});

ConfigurationFactorySuite(
  'addLabel should add given label info to existing label config',
  (context) => {
    // given
    const { configurationFactory } = context;
    configurationFactory.init('nl-NL');

    // test
    configurationFactory.addLabel('test', 'nl-NL', 'dit is een test');
    configurationFactory.addLabel('test', 'en-US', 'this is a test');

    // expect
    const { configuration } = configurationFactory;
    expect(configuration.labels.length).to.equal(1);
    expect(configuration.labels[0].id).to.equal('test');
    expect(configuration.labels[0].labels[1].languageCode).to.equal('en-US');
    expect(configuration.labels[0].labels[1].label).to.equal('this is a test');
  }
);

ConfigurationFactorySuite(
  'createAction should add an action with the given name',
  (context) => {
    // given
    const { configurationFactory } = context;
    configurationFactory.init('nl-NL');

    // test
    const creator = configurationFactory.createAction('TestAction');

    // expect
    const { configuration } = configurationFactory;
    expect(configuration.actions.length).to.equal(1);
    expect(configuration.actions[0].name).to.equal('TestAction');
    expect(creator).not.to.be.null;
  }
);

ConfigurationFactorySuite(
  'createInitAction should add an init action with the given name',
  (context) => {
    // given
    const { configurationFactory } = context;
    configurationFactory.init('nl-NL');

    // test
    const creator = configurationFactory.createInitAction('TestInitAction');

    // expect
    const { configuration } = configurationFactory;
    expect(configuration.initActions.length).to.equal(1);
    expect(configuration.initActions[0].name).to.equal('TestInitAction');
    expect(creator).not.to.be.null;
  }
);

ConfigurationFactorySuite(
  'createEventAction should add an event action with the given name',
  (context) => {
    // given
    const { configurationFactory } = context;
    configurationFactory.init('nl-NL');

    // test
    const creator = configurationFactory.createEventAction('TestEventAction');

    // expect
    const { configuration } = configurationFactory;
    expect(configuration.eventActions?.length).to.equal(1);
    expect(configuration.eventActions?.[0].name).to.equal('TestEventAction');
    expect(creator).not.to.be.null;
  }
);

ConfigurationFactorySuite(
  'createTimelineAction should add a timeline action with the given name to the timeline with the given uri',
  (context) => {
    // given
    const { configurationFactory } = context;
    configurationFactory.init('nl-NL');
    configurationFactory.addTimeline(
      'test',
      'animation',
      100,
      false,
      'selector'
    );

    // test
    const creator = configurationFactory.createTimelineAction(
      'test',
      'TestTimelineAction'
    );

    // expect
    const timeline = configurationFactory.getTimeline('test');

    expect(timeline?.timelineActions.length).to.equal(1);
    expect(timeline?.timelineActions[0].name).to.equal('TestTimelineAction');
    expect(creator).not.to.be.null;
  }
);

ConfigurationFactorySuite(
  'editAction should return an actioneditor instance',
  (context) => {
    // given
    const { configurationFactory } = context;
    configurationFactory.init('nl-NL');
    const id = configurationFactory.createAction('TestAction').getId();

    // test
    const editor = configurationFactory.editAction(id);

    // expect
    expect(editor).to.be.an.instanceOf(ActionEditor);
  }
);

ConfigurationFactorySuite(
  'editEventAction should return an actioneditor instance',
  (context) => {
    // given
    const { configurationFactory } = context;
    configurationFactory.init('nl-NL');
    const creator = configurationFactory.createEventAction('TestEventAction');
    const { actionConfig } = creator;

    // test
    const editor = configurationFactory.editEventAction(actionConfig.id);

    // expect
    expect(editor).to.be.an.instanceOf(ActionEditor);
  }
);

ConfigurationFactorySuite(
  'editInitAction should return an endableactioneditor instance',
  (context) => {
    // given
    const { configurationFactory } = context;
    configurationFactory.init('nl-NL');
    const creator = configurationFactory.createInitAction('TestInitAction');
    const { actionConfig } = creator;

    // test
    const editor = configurationFactory.editInitAction(actionConfig.id);

    // expect
    expect(editor).to.be.an.instanceOf(EndableActionEditor);
  }
);

ConfigurationFactorySuite(
  'editTimelineAction should return a timelineactioneditor instance',
  (context) => {
    // given
    const { configurationFactory } = context;
    configurationFactory.init('nl-NL');
    configurationFactory.addTimeline(
      'test',
      'animation',
      100,
      false,
      'selector'
    );

    const creator = configurationFactory.createTimelineAction(
      'test',
      'TestTimelineAction'
    );
    const { actionConfig } = creator;

    // test
    const editor = configurationFactory.editTimelineAction(
      'test',
      actionConfig.id
    );

    // expect
    expect(editor).to.be.an.instanceOf(TimelineActionEditor);
  }
);

ConfigurationFactorySuite.run();
