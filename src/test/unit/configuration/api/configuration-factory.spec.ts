import {
  ActionEditor,
  EndableActionEditor,
  TimelineActionEditor,
} from '@configuration/api/action-editor.ts';
import {ConfigurationFactory} from '@configuration/api/configuration-factory.ts';
import {TimelineProvidersSettingsEditor} from '@configuration/api/timeline-provider-settings-editor.ts';
import type {
  IActionConfiguration,
  IEngineConfiguration,
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

  describe<ConfigurationFactorySuiteContext>('round-trip edits', () => {
    test<ConfigurationFactorySuiteContext>('given an action created via createAction, when editAction(id).addStartOperation and setName are called, then getConfiguration().actions[0] has the new name and one start operation', context => {
      // given
      const {configurationFactory} = context;
      configurationFactory.init('en-US');
      const id = configurationFactory.createAction('A').getId();

      // test
      configurationFactory
        .editAction(id)
        .addStartOperation('selectElement', {selector: '#x'});
      configurationFactory.editAction(id).setName('B');

      // expect
      let action: IActionConfiguration | undefined;
      configurationFactory.getConfiguration(c => {
        action = c.actions[0];
        return c;
      });
      expect(action?.name).toBe('B');
      expect(action?.startOperations.length).toBe(1);
      expect(action?.startOperations[0].systemName).toBe('selectElement');
    });
    test<ConfigurationFactorySuiteContext>('given an action with three start operations, when editAction removes and moves operations, then the factory configuration reflects the change', context => {
      // given
      const {configurationFactory} = context;
      configurationFactory.init('en-US');
      const id = configurationFactory.createAction('A').getId();
      configurationFactory
        .editAction(id)
        .addStartOperation('selectElement', {selector: '#x'}, 'op1')
        .next()
        .addStartOperation('addClass', {className: 'a'}, 'op2')
        .next()
        .addStartOperation('removeClass', {className: 'a'}, 'op3');

      // test
      configurationFactory
        .editAction(id)
        .removeStartOperation('op2')
        .moveStartOperation('op1', 'up');

      // expect
      const ids =
        configurationFactory.configuration.actions[0].startOperations.map(
          o => o.id
        );
      expect(ids).toEqual(['op3', 'op1']);
    });
    test<ConfigurationFactorySuiteContext>('given an init action, when editInitAction removes and moves end operations and sets the name, then the factory configuration reflects the change', context => {
      // given
      const {configurationFactory} = context;
      configurationFactory.init('en-US');
      const creator = configurationFactory
        .createInitAction('Init')
        .addEndOperation('selectElement', {selector: '#x'})
        .addEndOperation('addClass', {className: 'a'})
        .addEndOperation('removeClass', {className: 'a'});
      const [first, second, third] = creator.actionConfig.endOperations.map(
        o => o.id
      );

      // test
      configurationFactory
        .editInitAction(creator.getId())
        .removeEndOperation(second)
        .moveEndOperation(first, 'up')
        .setName('Init2');

      // expect
      const action = configurationFactory.configuration.initActions[0];
      expect(action.name).toBe('Init2');
      expect(action.endOperations.map(o => o.id)).toEqual([third, first]);
    });
    test<ConfigurationFactorySuiteContext>('given an event action, when editEventAction sets the name and adds a start operation, then the factory configuration reflects the change', context => {
      // given
      const {configurationFactory} = context;
      configurationFactory.init('en-US');
      const id = configurationFactory.createEventAction('Evt').getId();

      // test
      configurationFactory
        .editEventAction(id)
        .setName('Evt2')
        .addStartOperation('selectElement', {selector: '#x'});

      // expect
      const action = configurationFactory.configuration.eventActions?.[0];
      expect(action?.name).toBe('Evt2');
      expect(action?.startOperations.length).toBe(1);
    });
    test<ConfigurationFactorySuiteContext>('given a timeline action, when editTimelineAction sets the duration and name, then the factory configuration reflects the change', context => {
      // given
      const {configurationFactory} = context;
      configurationFactory.init('en-US');
      configurationFactory.addTimeline('test', 'animation', 100, false, '#t');
      const id = configurationFactory
        .createTimelineAction('test', 'TA')
        .addDuration(1, 2)
        .getId();

      // test
      configurationFactory
        .editTimelineAction('test', id)
        .setDuration(5, 10)
        .setName('TA2');

      // expect
      const action =
        configurationFactory.getTimeline('test')?.timelineActions[0];
      expect(action?.name).toBe('TA2');
      expect(action?.duration).toEqual({start: 5, end: 10});
    });
    test<ConfigurationFactorySuiteContext>('given an action editor, when the getConfiguration callback returns a new config, then the factory configuration holds the new config', context => {
      // given
      const {configurationFactory} = context;
      configurationFactory.init('en-US');
      const id = configurationFactory.createAction('A').getId();

      // test
      configurationFactory
        .editAction(id)
        .getConfiguration(c => ({...c, name: 'C'}))
        .addStartOperation('selectElement', {selector: '#y'});

      // expect
      const action = configurationFactory.configuration.actions[0];
      expect(action.name).toBe('C');
      expect(action.startOperations.length).toBe(1);
    });
    test<ConfigurationFactorySuiteContext>('given an action created via createAction, when getConfiguration(c => (cfg = c)) and then addStartOperation are called, then the factory action has one start operation', context => {
      // given
      const {configurationFactory} = context;
      configurationFactory.init('en-US');
      const creator = configurationFactory.createAction('A');
      let cfg: IActionConfiguration | undefined;

      // test
      creator.getConfiguration(c => (cfg = c));
      creator.addStartOperation('selectElement', {selector: '#y'});

      // expect
      expect(cfg).toBeDefined();
      expect(
        configurationFactory.configuration.actions[0].startOperations.length
      ).toBe(1);
    });
    test<ConfigurationFactorySuiteContext>('given an action created via createAction, when the getConfiguration callback returns a renamed config, then the factory action holds the new name and later edits', context => {
      // given
      const {configurationFactory} = context;
      configurationFactory.init('en-US');
      const creator = configurationFactory.createAction('A');

      // test
      creator.getConfiguration(x => ({...x, name: 'C'}));
      creator.addEndOperation('selectElement', {selector: '#y'});

      // expect
      const action = configurationFactory.configuration.actions[0];
      expect(action.name).toBe('C');
      expect(action.endOperations.length).toBe(1);
    });
    test<ConfigurationFactorySuiteContext>('given a start operation, when its OperationEditor getConfiguration callback returns a new config, then the factory operation holds the new config', context => {
      // given
      const {configurationFactory} = context;
      configurationFactory.init('en-US');
      const id = configurationFactory.createAction('A').getId();
      const operationEditor = configurationFactory
        .editAction(id)
        .addStartOperation('selectElement', {selector: '#x'}, 'op1');

      // test
      operationEditor.getConfiguration(c => ({
        ...c,
        operationData: {selector: '#y'},
      }));

      // expect
      expect(
        configurationFactory.configuration.actions[0].startOperations[0]
          .operationData
      ).toEqual({selector: '#y'});
    });
    test('given a factory wrapping a configuration without timelineProviderSettings, when editTimelineProviderSettings().addProvider is called, then timelineProviderSettings.animation is defined', () => {
      // given
      const configurationFactory = new ConfigurationFactory({
        id: 'x',
      } as unknown as IEngineConfiguration);

      // test
      configurationFactory
        .editTimelineProviderSettings()
        .addProvider('animation');

      // expect
      let settings: IEngineConfiguration['timelineProviderSettings'];
      configurationFactory.getConfiguration(c => {
        settings = c.timelineProviderSettings;
        return c;
      });
      expect(settings?.animation).toBeDefined();
    });
  });

  describe<ConfigurationFactorySuiteContext>('getConfiguration with a callback', () => {
    test<ConfigurationFactorySuiteContext>('given an open action editor, when getConfiguration(callback) applies a change, then later edits through that editor still reach the factory configuration', context => {
      // given
      const {configurationFactory} = context;
      configurationFactory.init('en-US');
      const id = configurationFactory.createAction('A').getId();
      const editor = configurationFactory.editAction(id);

      // test
      configurationFactory.getConfiguration(c => {
        c.containerSelector = '#changed';
        return c;
      });
      editor.setName('B');

      // expect
      const {configuration} = configurationFactory;
      expect(configuration.containerSelector).toBe('#changed');
      expect(configuration.actions[0].name).toBe('B');
    });

    test<ConfigurationFactorySuiteContext>('given an open action editor, when the callback renames that action, then the editor sees the rename and its next edit is kept', context => {
      // given
      const {configurationFactory} = context;
      configurationFactory.init('en-US');
      const id = configurationFactory.createAction('A').getId();
      const editor = configurationFactory.editAction(id);

      // test
      configurationFactory.getConfiguration(c => {
        c.actions[0].name = 'Renamed';
        return c;
      });
      editor.addStartOperation('selectElement', {selector: '#x'});

      // expect
      const [action] = configurationFactory.configuration.actions;
      expect(action.name).toBe('Renamed');
      expect(action.startOperations.map(o => o.systemName)).toEqual([
        'selectElement',
      ]);
    });

    test<ConfigurationFactorySuiteContext>('given the callback removes an action, when getConfiguration returns, then the action is gone from the factory configuration', context => {
      // given
      const {configurationFactory} = context;
      configurationFactory.init('en-US');
      configurationFactory.createAction('A');
      configurationFactory.createAction('B');

      // test
      configurationFactory.getConfiguration(c => {
        c.actions = c.actions.filter(a => a.name !== 'A');
        return c;
      });

      // expect
      expect(
        configurationFactory.configuration.actions.map(a => a.name)
      ).toEqual(['B']);
    });

    test<ConfigurationFactorySuiteContext>('given getConfiguration(callback) returned a copy, when that copy is mutated afterwards, then the factory configuration does not change', context => {
      // given
      const {configurationFactory} = context;
      configurationFactory.init('en-US');
      configurationFactory.createAction('A');

      // test
      const copy = configurationFactory.getConfiguration(c => c);
      copy.actions[0].name = 'Mutated';
      copy.containerSelector = '#mutated';

      // expect
      const {configuration} = configurationFactory;
      expect(configuration.actions[0].name).toBe('A');
      expect(configuration.containerSelector).not.toBe('#mutated');
    });
  });
});
