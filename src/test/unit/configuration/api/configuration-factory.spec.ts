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

    test<ConfigurationFactorySuiteContext>('given a start operation, when an action editor getConfiguration callback returns operationData parsed from JSON with a __proto__ key, then Object.prototype is not polluted', context => {
      // given
      const {configurationFactory} = context;
      configurationFactory.init('en-US');
      const id = configurationFactory.createAction('A').getId();
      const editor = configurationFactory
        .editAction(id)
        .addStartOperation('selectElement', {selector: '#a'})
        .next();

      // test
      try {
        editor.getConfiguration(action => ({
          ...action,
          startOperations: action.startOperations.map(op => ({
            ...op,
            operationData: JSON.parse(
              '{"selector":"#b","__proto__":{"polluted":"yes"}}'
            ),
          })),
        }));

        // expect
        expect(({} as any).polluted).toBeUndefined();
        const [operation] = configurationFactory.configuration.actions[0]
          .startOperations as any[];
        expect(operation.operationData.selector).toBe('#b');
        expect(Object.hasOwn(operation.operationData, '__proto__')).toBe(false);
      } finally {
        delete (Object.prototype as any).polluted;
      }
    });

    test<ConfigurationFactorySuiteContext>('given a factory, when its getConfiguration callback returns a configuration parsed from JSON with __proto__ keys at the root and in an action, then Object.prototype is not polluted', context => {
      // given
      const {configurationFactory} = context;
      configurationFactory.init('en-US');
      configurationFactory.createAction('A');

      // test
      try {
        configurationFactory.getConfiguration(c => {
          const json = JSON.stringify(c).replace(
            '"actions":[{',
            '"__proto__":{"polluted":"root"},"actions":[{"__proto__":{"polluted":"action"},'
          );
          return JSON.parse(json);
        });

        // expect
        expect(({} as any).polluted).toBeUndefined();
        expect(configurationFactory.configuration.actions[0].name).toBe('A');
      } finally {
        delete (Object.prototype as any).polluted;
      }
    });
  });

  describe<ConfigurationFactorySuiteContext>('operation data ownership', () => {
    test<ConfigurationFactorySuiteContext>('given one operationData literal passed to addStartOperation twice, when setOperationDataItem changes selector on the first operation via editAction().editStartOperation(), then the second operation selector is still #a', context => {
      // given
      const {configurationFactory} = context;
      configurationFactory.init('en-US');
      const data = {selector: '#a'};
      const creator = configurationFactory
        .createAction('A')
        .addStartOperation('selectElement', data)
        .addStartOperation('selectElement', data);
      const id = creator.getId();
      const [first, second] = creator.actionConfig.startOperations;

      // test
      configurationFactory
        .editAction(id)
        .editStartOperation(first.id)
        .setOperationDataItem('selector', '#b');

      // expect
      expect(first.operationData).toEqual({selector: '#b'});
      expect(second.operationData).toEqual({selector: '#a'});
      expect(data).toEqual({selector: '#a'});
    });

    test<ConfigurationFactorySuiteContext>('given operationData passed to addEndOperation and an editor addStartOperation, when the caller mutates its object afterwards, then the stored operations do not change', context => {
      // given
      const {configurationFactory} = context;
      configurationFactory.init('en-US');
      const endData = {selector: '#end'};
      const startData = {selector: '#start'};
      const id = configurationFactory
        .createAction('A')
        .addEndOperation('selectElement', endData)
        .getId();
      const editor = configurationFactory.editAction(id);
      editor.addStartOperation('selectElement', startData);
      editor.addEndOperation('selectElement', startData);

      // test
      endData.selector = '#changed';
      startData.selector = '#changed';

      // expect
      const [action] = configurationFactory.configuration.actions as any[];
      expect(action.endOperations[0].operationData.selector).toBe('#end');
      expect(action.startOperations[0].operationData.selector).toBe('#start');
      expect(action.endOperations[1].operationData.selector).toBe('#start');
    });

    test<ConfigurationFactorySuiteContext>('given an operation editor, when setOperationData is called and the caller mutates its object afterwards, then the stored operation data does not change', context => {
      // given
      const {configurationFactory} = context;
      configurationFactory.init('en-US');
      const id = configurationFactory.createAction('A').getId();
      const data = {selector: '#a'};

      // test
      configurationFactory
        .editAction(id)
        .addStartOperation('selectElement', {})
        .setOperationData(data as any);
      data.selector = '#changed';

      // expect
      const [operation] = configurationFactory.configuration.actions[0]
        .startOperations as any[];
      expect(operation.operationData.selector).toBe('#a');
    });
  });

  describe<ConfigurationFactorySuiteContext>('editTimelineAction errors', () => {
    test<ConfigurationFactorySuiteContext>('given a factory with timeline main, when editTimelineAction is called with unknown uri mian and id abc-123, then it throws naming the uri', context => {
      // given
      const {configurationFactory} = context;
      configurationFactory
        .init('en-US')
        .addTimeline('main', 'animation', 10, false, '#t');

      // test + expect
      expect(() =>
        configurationFactory.editTimelineAction('mian', 'abc-123')
      ).toThrowError("No timeline found for uri 'mian'");
    });

    test<ConfigurationFactorySuiteContext>('given a factory with timeline main, when editTimelineAction is called with an unknown action id, then it throws naming the id and the uri', context => {
      // given
      const {configurationFactory} = context;
      configurationFactory
        .init('en-US')
        .addTimeline('main', 'animation', 10, false, '#t');

      // test + expect
      expect(() =>
        configurationFactory.editTimelineAction('main', 'abc-123')
      ).toThrowError(
        "Timeline action not found for id 'abc-123' in timeline 'main'"
      );
    });
  });

  describe<ConfigurationFactorySuiteContext>('duplicate action names', () => {
    test<ConfigurationFactorySuiteContext>('given an action named Show, when createAction is called with Show again, then it throws naming the duplicate', context => {
      // given
      const {configurationFactory} = context;
      configurationFactory.init('en-US').createAction('Show');

      // test + expect
      expect(() => configurationFactory.createAction('Show')).toThrowError(
        "Action name 'Show' already exists in actions or eventActions. Action names must be unique across actions and eventActions."
      );
      expect(configurationFactory.configuration.actions.length).toBe(1);
    });

    test<ConfigurationFactorySuiteContext>('given an action named Show, when createEventAction is called with Show, then it throws', context => {
      // given
      const {configurationFactory} = context;
      configurationFactory.init('en-US').createAction('Show');

      // test + expect
      expect(() => configurationFactory.createEventAction('Show')).toThrowError(
        /Action name 'Show' already exists/
      );
      expect(configurationFactory.configuration.eventActions ?? []).toEqual([]);
    });

    test<ConfigurationFactorySuiteContext>('given actions Show and Hide, when the Hide creator or editor is renamed to Show, then it throws and keeps the old name', context => {
      // given
      const {configurationFactory} = context;
      configurationFactory.init('en-US').createAction('Show');
      const creator = configurationFactory.createEventAction('Hide');

      // test + expect
      expect(() => creator.setName('Show')).toThrowError(
        /Action name 'Show' already exists/
      );
      expect(() =>
        configurationFactory.editEventAction(creator.getId()).setName('Show')
      ).toThrowError(/Action name 'Show' already exists/);
      expect(creator.actionConfig.name).toBe('Hide');
    });

    test<ConfigurationFactorySuiteContext>('given an init action named Show, when an action named Show is created and the init action is renamed to itself, then nothing throws', context => {
      // given
      const {configurationFactory} = context;
      const init = configurationFactory.init('en-US').createInitAction('Show');

      // test + expect
      expect(() => configurationFactory.createAction('Show')).not.toThrow();
      expect(() => init.setName('Show')).not.toThrow();
      expect(() =>
        configurationFactory
          .editAction(configurationFactory.configuration.actions[0].id)
          .setName('Show')
      ).not.toThrow();
    });
  });

  describe('TypeDoc example', () => {
    test('given the ConfigurationFactory class example, when it is run, then it builds an animation provider and an image action', () => {
      // given
      const factory = new ConfigurationFactory()
        .init('en-US')
        .addLanguage('en-US', 'English')
        .setContainerSelector('#ct-container')
        .addTimeline(
          'timeline-1',
          'animation',
          200,
          false,
          '.timeline-container'
        )
        .editTimelineProviderSettings()
        .addProvider('animation', 'RafPositionSource')
        .setContainer('.timeline-container')
        .end();

      // test
      factory
        .createInitAction('AddImage')
        .addStartOperation('selectElement', {selector: '.timeline-container'})
        .addStartOperation('createElement', {
          elementName: 'img',
          attributes: {src: 'my-image.png', id: 'my-image-id'},
        })
        .addStartOperation('setElementContent', {insertionType: 'append'});

      // expect
      const configuration = factory.getConfiguration();
      expect(
        configuration.timelineProviderSettings?.animation?.positionSource
          .systemName
      ).toBe('RafPositionSource');
      expect(configuration.initActions[0].startOperations.length).toBe(3);
    });
  });

  describe<ConfigurationFactorySuiteContext>('fluent typing', () => {
    test<ConfigurationFactorySuiteContext>('given selectElement operations added by name, when the operation data has a wrong property type, then the compiler rejects it for every add method', context => {
      // given
      const {configurationFactory} = context;
      const creator = configurationFactory.init('en-US').createAction('A');

      // test
      // @ts-expect-error selector must be a string
      creator.addEndOperation('selectElement', {selector: 5});
      const editor = configurationFactory.editAction(creator.getId());
      // @ts-expect-error selector must be a string
      editor.addStartOperation('selectElement', {selector: 5});
      // @ts-expect-error selector must be a string
      editor.addEndOperation('selectElement', {selector: 5});
      const keys: string[] = editor
        .addStartOperation('selectElement', {selector: '#a'})
        .getOperationDataKeys();

      // expect
      expect(keys).toEqual(['selector']);
      expect(creator.actionConfig.startOperations.length).toBe(2);
      expect(creator.actionConfig.endOperations.length).toBe(2);
    });
  });

  describe<ConfigurationFactorySuiteContext>('timeline action durations', () => {
    test<ConfigurationFactorySuiteContext>('given a timeline action, when addDuration(0, 0) is called, then end 0 is kept', context => {
      // given
      const {configurationFactory} = context;
      configurationFactory
        .init('en-US')
        .addTimeline('main', 'animation', 10, false, '#t');

      // test
      const creator = configurationFactory
        .createTimelineAction('main', 'A')
        .addDuration(0, 0);

      // expect
      expect(creator.actionConfig.duration).toEqual({start: 0, end: 0});
    });

    test<ConfigurationFactorySuiteContext>('given a timeline action, when addDuration is called with start after end, then it throws', context => {
      // given
      const {configurationFactory} = context;
      configurationFactory
        .init('en-US')
        .addTimeline('main', 'animation', 10, false, '#t');
      const creator = configurationFactory.createTimelineAction('main', 'A');

      // test + expect
      expect(() => creator.addDuration(5, 2)).toThrowError(
        'addDuration: start (5) cannot be higher than end (2)'
      );
    });

    test<ConfigurationFactorySuiteContext>('given a timeline action editor, when setDuration(0, 0) is called, then end 0 is kept', context => {
      // given
      const {configurationFactory} = context;
      configurationFactory
        .init('en-US')
        .addTimeline('main', 'animation', 10, false, '#t');
      const id = configurationFactory
        .createTimelineAction('main', 'A')
        .addDuration(1, 2)
        .getId();

      // test
      configurationFactory.editTimelineAction('main', id).setDuration(0, 0);

      // expect
      expect(
        configurationFactory.configuration.timelines[0].timelineActions[0]
          .duration
      ).toEqual({start: 0, end: 0});
    });
  });
});
