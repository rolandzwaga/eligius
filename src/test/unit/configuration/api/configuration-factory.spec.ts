import {
  ActionEditor,
  EndableActionEditor,
  TimelineActionEditor,
} from '@configuration/api/action-editor.ts';
import {ConfigurationFactory} from '@configuration/api/configuration-factory.ts';
import {TimelineProvidersSettingsEditor} from '@configuration/api/timeline-provider-settings-editor.ts';
import type {
  IActionConfiguration,
  ITimelineActionConfiguration,
} from '@configuration/types.ts';
import {beforeEach, describe, expect, type TestContext, test} from 'vitest';
import type {TLanguageCode} from '@/types.ts';

type ConfigurationFactorySuiteContext = {
  configurationFactory: ConfigurationFactory;
} & TestContext;

describe<ConfigurationFactorySuiteContext>('ConfigurationFactory', () => {
  beforeEach<ConfigurationFactorySuiteContext>(context => {
    context.configurationFactory = new ConfigurationFactory();
  });
  test<ConfigurationFactorySuiteContext>('should initialize a config', context => {
    //given
    const {configurationFactory} = context;
    // test
    configurationFactory.init('nl-NL');

    // expect
    const {configuration} = configurationFactory;
    expect(configuration.id).not.toBeUndefined();
    expect(configuration.engine.systemName).toBe('EligiusEngine');
    expect(configuration.containerSelector).toBe('[data-ct-container=true]');
    expect(configuration.timelineProviderSettings).toEqual({});
    expect(configuration.language).toBe('nl-NL');
    expect(configuration.availableLanguages.length).toBe(0);
  });
  test<ConfigurationFactorySuiteContext>('should set the container selector', context => {
    // given
    const {configurationFactory} = context;
    configurationFactory.init('nl-NL');
    const selector = 'selector';

    // test
    configurationFactory.setContainerSelector(selector);

    // expect
    const {configuration} = configurationFactory;
    expect(configuration.containerSelector).toBe(selector);
  });
  test<ConfigurationFactorySuiteContext>('should set the default language', context => {
    // given
    const {configurationFactory} = context;
    configurationFactory.init('nl-NL');
    const language = 'en-US';

    // test
    configurationFactory.setDefaultLanguage(language);

    // expect
    const {configuration} = configurationFactory;
    expect(configuration.language).toBe(language);
  });
  test<ConfigurationFactorySuiteContext>('should return a timeline provider editor', context => {
    // given
    const {configurationFactory} = context;
    configurationFactory.init('nl-NL');

    // test
    const editor = configurationFactory.editTimelineProviderSettings();

    // expect
    expect(editor).toBeInstanceOf(TimelineProvidersSettingsEditor);
  });
  test<ConfigurationFactorySuiteContext>('should add the given language', context => {
    // given
    const {configurationFactory} = context;
    configurationFactory.init('nl-NL');

    // test
    configurationFactory.addLanguage('en-US', 'English');

    // expect
    const {configuration} = configurationFactory;
    expect(configuration.availableLanguages.length).toBe(1);
    const lang = configuration.availableLanguages[0];
    expect(lang.languageCode).toBe('en-US');
    expect(lang.label).toBe('English');
  });
  test<ConfigurationFactorySuiteContext>('addAction should add the specified action', context => {
    // given
    const {configurationFactory} = context;
    configurationFactory.init('nl-NL');
    const action = {} as IActionConfiguration;

    // test
    configurationFactory.addAction(action);

    // expect
    const {configuration} = configurationFactory;
    expect(configuration.actions.length).toBe(1);
    expect(configuration.actions[0]).toBe(action);
  });
  test<ConfigurationFactorySuiteContext>('addInitAction should add the specified initAction', context => {
    // given
    const {configurationFactory} = context;
    configurationFactory.init('nl-NL');
    const action = {} as IActionConfiguration;

    // test
    configurationFactory.addInitAction(action);

    // expect
    const {configuration} = configurationFactory;
    expect(configuration.initActions.length).toBe(1);
    expect(configuration.initActions[0]).toBe(action);
  });
  test<ConfigurationFactorySuiteContext>('addEventAction should add the specified eventAction', context => {
    // given
    const {configurationFactory} = context;
    configurationFactory.init('nl-NL');
    const action = {} as IActionConfiguration;

    // test
    configurationFactory.addEventAction(action);

    // expect
    const {configuration} = configurationFactory;
    expect(configuration.eventActions?.length).toBe(1);
    expect(configuration.eventActions?.[0]).toBe(action);
  });
  test<ConfigurationFactorySuiteContext>('addTimelineAction should throw error when timeline is not found for given uri', context => {
    // given
    const {configurationFactory} = context;
    configurationFactory.init('nl-NL');

    // expect
    expect(() =>
      configurationFactory.addTimelineAction(
        'test',
        {} as ITimelineActionConfiguration
      )
    ).toThrow("No timeline found for uri 'test'");
  });
  test<ConfigurationFactorySuiteContext>('addTimeline should add the specified timeline', context => {
    // given
    const {configurationFactory} = context;
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
    expect(timeline).not.toBeNull();
    expect(timeline?.uri).toBe('test');
    expect(timeline?.type).toBe('animation');
    expect(timeline?.duration).toBe(100);
    expect(timeline?.loop).toBe(false);
    expect(timeline?.selector).toBe('selector');
  });
  test<ConfigurationFactorySuiteContext>('addTimeline should throw an error when a timeline with the given uri already exists', context => {
    // given
    const {configurationFactory} = context;
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
    ).toThrow('timeline for uri test already exists');
  });
  test<ConfigurationFactorySuiteContext>('addTimelineAction should add the specified action', context => {
    // given
    const {configurationFactory} = context;
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
    expect(timeline?.timelineActions.length).toBe(1);
    expect(timeline?.timelineActions[0]).toBe(action);
  });
  test<ConfigurationFactorySuiteContext>('removeTimeline should remove the timeline for the given uri', context => {
    // given
    const {configurationFactory} = context;
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
    const {configuration} = configurationFactory;
    expect(configuration.timelines.length).toBe(0);
  });
  test<ConfigurationFactorySuiteContext>('createAction should add an action with the given name', context => {
    // given
    const {configurationFactory} = context;
    configurationFactory.init('nl-NL');

    // test
    const creator = configurationFactory.createAction('TestAction');

    // expect
    const {configuration} = configurationFactory;
    expect(configuration.actions.length).toBe(1);
    expect(configuration.actions[0].name).toBe('TestAction');
    expect(creator).not.toBeNull();
  });
  test<ConfigurationFactorySuiteContext>('createInitAction should add an init action with the given name', context => {
    // given
    const {configurationFactory} = context;
    configurationFactory.init('nl-NL');

    // test
    const creator = configurationFactory.createInitAction('TestInitAction');

    // expect
    const {configuration} = configurationFactory;
    expect(configuration.initActions.length).toBe(1);
    expect(configuration.initActions[0].name).toBe('TestInitAction');
    expect(creator).not.toBeNull();
  });
  test<ConfigurationFactorySuiteContext>('createEventAction should add an event action with the given name', context => {
    // given
    const {configurationFactory} = context;
    configurationFactory.init('nl-NL');

    // test
    const creator = configurationFactory.createEventAction('TestEventAction');

    // expect
    const {configuration} = configurationFactory;
    expect(configuration.eventActions?.length).toBe(1);
    expect(configuration.eventActions?.[0].name).toBe('TestEventAction');
    expect(creator).not.toBeNull();
  });
  test<ConfigurationFactorySuiteContext>('createTimelineAction should add a timeline action with the given name to the timeline with the given uri', context => {
    // given
    const {configurationFactory} = context;
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

    expect(timeline?.timelineActions.length).toBe(1);
    expect(timeline?.timelineActions[0].name).toBe('TestTimelineAction');
    expect(creator).not.toBeNull();
  });
  test<ConfigurationFactorySuiteContext>('editAction should return an actioneditor instance', context => {
    // given
    const {configurationFactory} = context;
    configurationFactory.init('nl-NL');
    const id = configurationFactory.createAction('TestAction').getId();

    // test
    const editor = configurationFactory.editAction(id);

    // expect
    expect(editor).toBeInstanceOf(ActionEditor);
  });
  test<ConfigurationFactorySuiteContext>('editEventAction should return an actioneditor instance', context => {
    // given
    const {configurationFactory} = context;
    configurationFactory.init('nl-NL');
    const creator = configurationFactory.createEventAction('TestEventAction');
    const {actionConfig} = creator;

    // test
    const editor = configurationFactory.editEventAction(actionConfig.id);

    // expect
    expect(editor).toBeInstanceOf(ActionEditor);
  });
  test<ConfigurationFactorySuiteContext>('editInitAction should return an endableactioneditor instance', context => {
    // given
    const {configurationFactory} = context;
    configurationFactory.init('nl-NL');
    const creator = configurationFactory.createInitAction('TestInitAction');
    const {actionConfig} = creator;

    // test
    const editor = configurationFactory.editInitAction(actionConfig.id);

    // expect
    expect(editor).toBeInstanceOf(EndableActionEditor);
  });
  test<ConfigurationFactorySuiteContext>('editTimelineAction should return a timelineactioneditor instance', context => {
    // given
    const {configurationFactory} = context;
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
    const {actionConfig} = creator;

    // test
    const editor = configurationFactory.editTimelineAction(
      'test',
      actionConfig.id
    );

    // expect
    expect(editor).toBeInstanceOf(TimelineActionEditor);
  });
  test<ConfigurationFactorySuiteContext>('extend factory with single method', context => {
    // given
    const {configurationFactory} = context;
    const extendedFactory = ConfigurationFactory.extend(
      configurationFactory,
      'addThings',
      function () {
        this.init('nl-NL');
        this.addTimeline('test', 'animation', 100, false, 'selector');
        return this;
      }
    );

    // test
    extendedFactory.addThings();

    // expect
    const {configuration} = configurationFactory;
    expect(configuration.language).toBe('nl-NL');
    const timeline = configurationFactory.getTimeline('test');
    expect(timeline).not.toBeNull();
    expect(timeline?.uri).toBe('test');
    expect(timeline?.type).toBe('animation');
    expect(timeline?.duration).toBe(100);
    expect(timeline?.loop).toBe(false);
    expect(timeline?.selector).toBe('selector');
  });
  test<ConfigurationFactorySuiteContext>('extend factory with multiple methods', context => {
    // given
    const {configurationFactory} = context;
    const extendedFactory = ConfigurationFactory.extendMultiple(
      configurationFactory,
      {
        addThings: function (langCode: TLanguageCode) {
          this.init(langCode);
          return this;
        },
        addThings2: function (name: string) {
          this.addTimeline(name, 'animation', 100, false, 'selector');
          return this;
        },
      }
    );

    // test
    extendedFactory.addThings('nl-NL');
    extendedFactory.addThings2('test');

    // expect
    const {configuration} = configurationFactory;
    expect(configuration.language).toBe('nl-NL');
    const timeline = configurationFactory.getTimeline('test');
    expect(timeline).not.toBeNull();
    expect(timeline?.uri).toBe('test');
    expect(timeline?.type).toBe('animation');
    expect(timeline?.duration).toBe(100);
    expect(timeline?.loop).toBe(false);
    expect(timeline?.selector).toBe('selector');
  });
});
