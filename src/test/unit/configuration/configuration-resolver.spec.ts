import {ConfigurationResolver} from '@configuration/configuration-resolver.ts';
import type {IEngineConfiguration} from '@configuration/types.ts';
import type {Eventbus} from '@eventbus/index.ts';
import {EligiusResourceImporter} from '@importer/eligius-resource-importer.ts';
import {createMockEventbus} from '@test/fixtures/eventbus-factory.ts';
import {beforeEach, describe, expect, type TestContext, test, vi} from 'vitest';
import type {ISimpleResourceImporter} from '../../../types.ts';

function createMockImporter() {
  const lookup: Record<string, any> = {};
  return {
    lookup,
    // Unregistered names resolve to a dummy operation function
    import: vi.fn((name: string) => {
      return Object.hasOwn(lookup, name)
        ? {[name]: lookup[name]}
        : {[name]: () => {}};
    }),
    addEntry(name: string, value: any) {
      lookup[name] = value;
    },
  };
}

function createMockActionRegistryListener() {
  return {
    eventAction: undefined as any,
    eventName: '',
    eventTopic: undefined as string | undefined,
    registerAction: vi.fn(function (
      this: any,
      eventAction: any,
      eventName: string,
      eventTopic?: string
    ) {
      this.eventAction = eventAction;
      this.eventName = eventName;
      this.eventTopic = eventTopic;
    }),
  };
}

function createTestConfig(): IEngineConfiguration {
  return {
    id: 'testId',
    engine: {systemName: 'TestEngine'},
    timelineProviderSettings: {} as any,
    containerSelector: 'containerSelector',
    language: 'nl-NL',
    layoutTemplate: 'layoutTemplate',
    cssFiles: [],
    availableLanguages: [],
    initActions: [],
    actions: [],
    eventActions: undefined,
    timelines: [],
    timelineFlow: undefined,
  };
}

type ConfigurationResolverSuiteContext = {
  importer: ReturnType<typeof createMockImporter>;
  eventbus: Eventbus;
} & TestContext;

describe<ConfigurationResolverSuiteContext>('ConfigurationResolver', () => {
  beforeEach<ConfigurationResolverSuiteContext>(context => {
    context.importer = createMockImporter();
    context.eventbus = createMockEventbus() as Eventbus;
  });
  test<ConfigurationResolverSuiteContext>('should create', context => {
    // given
    const {importer, eventbus} = context;
    // test
    const resolver = new ConfigurationResolver(
      importer as unknown as ISimpleResourceImporter,
      eventbus
    );

    // expect
    expect(resolver).not.toBeNull();
  });
  test<ConfigurationResolverSuiteContext>('should initialize event actions', context => {
    // given
    const {importer, eventbus} = context;
    const config = createTestConfig();
    config.eventActions = [
      {
        id: 'test',
        name: 'TestAction',
        eventName: 'testEvent',
        eventTopic: 'testTopic',
        startOperations: [
          {
            id: 'test',
            systemName: 'selectElement',
            operationData: {
              selector: '#progress',
            },
          },
        ],
      },
    ];
    const resolver = new ConfigurationResolver(
      importer as unknown as ISimpleResourceImporter,
      eventbus
    );
    const registry = createMockActionRegistryListener();

    // test
    resolver.process(config, registry as any);

    // expect
    expect(registry.eventAction).not.toBeUndefined();
    expect(registry.eventName).toBe('testEvent');
    expect(registry.eventTopic).toBe('testTopic');
  });
  test<ConfigurationResolverSuiteContext>('should initialize initActions', context => {
    // given
    const {importer, eventbus} = context;
    const config = createTestConfig();
    config.initActions = [
      {
        id: 'test',
        name: 'TestAction',
        startOperations: [
          {
            id: 'test',
            systemName: 'selectElement',
            operationData: {
              selector: '#progress',
            },
          },
        ],
        endOperations: [
          {
            id: 'test2',
            systemName: 'removeElement',
            operationData: {
              selector: '#progress',
            },
          },
        ],
      },
    ];
    const resolver = new ConfigurationResolver(
      importer as unknown as ISimpleResourceImporter,
      eventbus
    );

    // test
    const [, processedConfig] = resolver.process(config);

    // expect
    const actionConfig = config.initActions[0];
    const resolvedAction = processedConfig.initActions[0];

    expect(resolvedAction).not.toBeUndefined();
    expect(resolvedAction.id).toBe(actionConfig.id);
    expect(resolvedAction.name).toBe(actionConfig.name);
    expect(resolvedAction.startOperations.length).toBe(
      actionConfig.startOperations.length
    );
    expect(resolvedAction.endOperations.length).toBe(
      actionConfig.endOperations.length
    );

    let operationConfig = actionConfig.startOperations[0];
    let resolvedOperation = resolvedAction.startOperations[0];

    expect(resolvedOperation.instance).not.toBeUndefined();
    expect(resolvedOperation.id).toBe(operationConfig.id);
    expect(resolvedOperation.systemName).toBe(operationConfig.systemName);
    expect(resolvedOperation.operationData).toEqual(
      operationConfig.operationData
    );

    operationConfig = actionConfig.endOperations[0];
    resolvedOperation = resolvedAction.endOperations[0];

    expect(resolvedOperation.instance).not.toBeUndefined();
    expect(resolvedOperation.id).toBe(operationConfig.id);
    expect(resolvedOperation.systemName).toBe(operationConfig.systemName);
    expect(resolvedOperation.operationData).toEqual(
      operationConfig.operationData
    );
  });
  test<ConfigurationResolverSuiteContext>('should initialize actions', context => {
    // given
    const {importer, eventbus} = context;
    const config = createTestConfig();
    config.actions = [
      {
        id: 'test',
        name: 'TestAction',
        startOperations: [
          {
            id: 'test',
            systemName: 'selectElement',
            operationData: {
              selector: '#progress',
            },
          },
        ],
        endOperations: [
          {
            id: 'test2',
            systemName: 'removeElement',
            operationData: {
              selector: '#progress',
            },
          },
        ],
      },
    ];
    const resolver = new ConfigurationResolver(
      importer as unknown as ISimpleResourceImporter,
      eventbus
    );

    // test
    const [actionsLookup, processedConfig] = resolver.process(config);

    // expect
    const resolvedAction = actionsLookup['TestAction'];
    expect(resolvedAction).not.toBeNull();
    expect(processedConfig.actions).not.toBeUndefined();
    expect(processedConfig.actions[0]).not.toBeUndefined();
    expect(
      processedConfig.actions[0].startOperations[0].instance
    ).not.toBeUndefined();
    expect(
      processedConfig.actions[0].endOperations[0].instance
    ).not.toBeUndefined();
  });
  test<ConfigurationResolverSuiteContext>('should initialize timeline actions', context => {
    // given
    const {importer, eventbus} = context;
    const config = createTestConfig();
    // Every timeline type needs provider settings
    config.timelineProviderSettings = {
      animation: {positionSource: {systemName: 'RafPositionSource'}},
    };
    config.timelines = [
      {
        id: '111-222-333-444',
        uri: 'uri',
        type: 'animation',
        duration: 100,
        loop: false,
        selector: '#selector',
        timelineActions: [
          {
            id: 'test',
            name: 'TestAction',
            duration: {
              start: 10,
              end: 15,
            },
            startOperations: [
              {
                id: 'test',
                systemName: 'selectElement',
                operationData: {
                  selector: '#progress',
                },
              },
            ],
            endOperations: [
              {
                id: 'test2',
                systemName: 'removeElement',
                operationData: {
                  selector: '#progress',
                },
              },
            ],
          },
        ],
      },
    ];
    const resolver = new ConfigurationResolver(
      importer as unknown as ISimpleResourceImporter,
      eventbus
    );

    // test
    const [, processedConfig] = resolver.process(config);

    // expect
    const timeline = config.timelines[0];
    const resolvedTimeline = processedConfig.timelines[0];

    expect(timeline.id).toBe(resolvedTimeline.id);
    expect(timeline.uri).toBe(resolvedTimeline.uri);
    expect(timeline.type).toBe(resolvedTimeline.type);
    expect(timeline.duration).toBe(resolvedTimeline.duration);
    expect(timeline.loop).toBe(resolvedTimeline.loop);
    expect(timeline.selector).toBe(resolvedTimeline.selector);

    const actionConfig = timeline.timelineActions[0];
    const resolvedAction: any = resolvedTimeline.timelineActions[0];
    expect(resolvedAction).not.toBeNull();
    expect(resolvedAction.eventbus).toBe(eventbus);
    expect(resolvedAction.id).toBe(actionConfig.id);
    expect(resolvedAction.name).toBe(actionConfig.name);
  });
  test<ConfigurationResolverSuiteContext>('should resolve config: properties', context => {
    // given
    const {importer, eventbus} = context;
    const config = createTestConfig();
    config.id = 'config:engine.systemName';
    const resolver = new ConfigurationResolver(
      importer as unknown as ISimpleResourceImporter,
      eventbus
    );

    // test
    const [, processedConfig] = resolver.process(config);

    // expect
    expect(processedConfig.id).toBe(config.engine.systemName);
  });

  test<ConfigurationResolverSuiteContext>('should resolve json: properties', context => {
    // given
    const {importer, eventbus} = context;
    const config = createTestConfig();
    config.id = 'json:test';
    const resolver = new ConfigurationResolver(
      importer as unknown as ISimpleResourceImporter,
      eventbus
    );
    importer.addEntry('test', {
      test: 'testValue',
    });

    // test
    resolver.process(config);

    // expect
    expect((config.id as any).test).toBe('testValue');
  });

  test<ConfigurationResolverSuiteContext>('should resolve template: properties', context => {
    // given
    const {importer, eventbus} = context;
    const config = createTestConfig();
    config.layoutTemplate = 'template:test';

    const resolver = new ConfigurationResolver(
      importer as unknown as ISimpleResourceImporter,
      eventbus
    );
    importer.addEntry('test', '<div>This is my template</div>');

    // test
    resolver.process(config);

    // expect
    expect(config.layoutTemplate).toBe('<div>This is my template</div>');
  });

  describe<ConfigurationResolverSuiteContext>('unknown operations', () => {
    function createActionWithOperation(systemName: string) {
      return {
        id: 'action-id',
        name: 'TestAction',
        startOperations: [
          {
            id: 'op-id',
            systemName,
            operationData: {selector: '#progress'},
          },
        ],
        endOperations: [],
      } as any;
    }

    test<ConfigurationResolverSuiteContext>('given a config whose action startOperation has systemName selectElemnt, when process is called, then it throws naming the operation, its JSON path and the closest known name', context => {
      // given
      const {importer, eventbus} = context;
      importer.addEntry('selectElemnt', undefined);
      const resourceImporter = {
        ...importer,
        import: importer.import,
        getOperationNames: () => ['selectElement', 'removeElement', 'when'],
      };
      const config = createTestConfig();
      config.actions = [createActionWithOperation('selectElemnt')];
      const resolver = new ConfigurationResolver(resourceImporter, eventbus);

      // test + expect
      expect(() => resolver.process(config)).toThrowError(
        "Unknown operation 'selectElemnt' at actions[0].startOperations[0].systemName. Did you mean 'selectElement'?"
      );
    });

    test<ConfigurationResolverSuiteContext>('given an unknown end operation in a timeline action, when process is called, then the error names the timeline action JSON path', context => {
      // given
      const {importer, eventbus} = context;
      importer.addEntry('doesNotExist', undefined);
      const config = createTestConfig();
      const timelineAction = {
        ...createActionWithOperation('selectElement'),
        duration: {start: 0, end: 1},
        endOperations: [
          {id: 'a', systemName: 'removeElement', operationData: {}},
          {id: 'b', systemName: 'doesNotExist', operationData: {}},
        ],
      };
      config.timelines = [
        {
          id: 't1',
          uri: 'uri',
          type: 'animation',
          duration: 10,
          loop: false,
          selector: '#sel',
          timelineActions: [timelineAction, timelineAction],
        },
      ];
      const resolver = new ConfigurationResolver(
        importer as unknown as ISimpleResourceImporter,
        eventbus
      );

      // test + expect
      expect(() => resolver.process(config)).toThrowError(
        "Unknown operation 'doesNotExist' at timelines[0].timelineActions[0].endOperations[1].systemName. Check the spelling, or make sure the operation is available from the resource importer."
      );
    });

    test<ConfigurationResolverSuiteContext>('given an unknown operation in an init action, when process is called, then the error names the initActions path', context => {
      // given
      const {importer, eventbus} = context;
      importer.addEntry('nope', {});
      const config = createTestConfig();
      config.initActions = [
        createActionWithOperation('selectElement'),
        createActionWithOperation('nope'),
      ];
      const resolver = new ConfigurationResolver(
        importer as unknown as ISimpleResourceImporter,
        eventbus
      );

      // test + expect
      expect(() => resolver.process(config)).toThrowError(
        /at initActions\[1\]\.startOperations\[0\]\.systemName/
      );
    });

    test<ConfigurationResolverSuiteContext>('given an unknown operation in an event action, when process is called, then the error names the eventActions path', context => {
      // given
      const {importer, eventbus} = context;
      importer.addEntry('nope', undefined);
      const config = createTestConfig();
      config.eventActions = [
        {
          ...createActionWithOperation('nope'),
          eventName: 'evt',
        },
      ];
      const resolver = new ConfigurationResolver(
        importer as unknown as ISimpleResourceImporter,
        eventbus
      );

      // test + expect
      expect(() =>
        resolver.process(config, createMockActionRegistryListener() as any)
      ).toThrowError(/at eventActions\[0\]\.startOperations\[0\]\.systemName/);
    });

    test<ConfigurationResolverSuiteContext>('given an importer that throws for unknown names, when process is called with a misspelled operation, then the resolver error names the JSON path and keeps the importer error as cause', context => {
      // given
      const {eventbus} = context;
      const importerError = new Error("unknown system name 'selectElemnt'");
      const throwingImporter = {
        import: (name: string) => {
          if (name === 'selectElemnt') {
            throw importerError;
          }
          return {[name]: () => {}};
        },
        getOperationNames: () => ['selectElement'],
      };
      const config = createTestConfig();
      config.actions = [createActionWithOperation('selectElemnt')];
      const resolver = new ConfigurationResolver(throwingImporter, eventbus);

      // test
      let error: any;
      try {
        resolver.process(config);
      } catch (e) {
        error = e;
      }

      // expect
      expect(error.message).toBe(
        "Unknown operation 'selectElemnt' at actions[0].startOperations[0].systemName. Did you mean 'selectElement'?"
      );
      expect(error.cause).toBe(importerError);
    });
  });

  describe<ConfigurationResolverSuiteContext>('unknown placeholder imports', () => {
    function createThrowingImporter() {
      return {
        import: (name: string): Record<string, any> => {
          throw new Error(`unknown system name '${name}'`);
        },
      };
    }

    test<ConfigurationResolverSuiteContext>('given an importer that throws for an unknown template, when process is called, then the error names the placeholder and keeps the importer message', context => {
      // given
      const {eventbus} = context;
      const config = createTestConfig();
      config.layoutTemplate = 'template:mian';
      const resolver = new ConfigurationResolver(
        createThrowingImporter(),
        eventbus
      );

      // test + expect
      expect(() => resolver.process(config)).toThrowError(
        "Unable to resolve placeholder 'template:mian' at layoutTemplate: unknown system name 'mian'"
      );
    });

    test<ConfigurationResolverSuiteContext>('given an importer that throws for an unknown json import, when process is called, then the error names the placeholder', context => {
      // given
      const {eventbus} = context;
      const config = createTestConfig();
      config.id = 'json:data';
      const resolver = new ConfigurationResolver(
        createThrowingImporter(),
        eventbus
      );

      // test + expect
      expect(() => resolver.process(config)).toThrowError(
        /^Unable to resolve placeholder 'json:data' at id: /
      );
    });
  });

  describe<ConfigurationResolverSuiteContext>('duplicate action names', () => {
    function createAction(id: string, name: string) {
      return {id, name, startOperations: [], endOperations: []} as any;
    }

    test<ConfigurationResolverSuiteContext>('given two actions configured with the same name, when process is called, then it throws naming the duplicate name and both JSON paths', context => {
      // given
      const {importer, eventbus} = context;
      const config = createTestConfig();
      config.actions = [
        createAction('1', 'Show'),
        createAction('2', 'Hide'),
        createAction('3', 'Show'),
      ];
      const resolver = new ConfigurationResolver(
        importer as unknown as ISimpleResourceImporter,
        eventbus
      );

      // test + expect
      expect(() => resolver.process(config)).toThrowError(
        "Duplicate action name 'Show' at actions[0].name and actions[2].name"
      );
    });

    test<ConfigurationResolverSuiteContext>('given an event action with the same name as an action, when process is called, then it throws naming both JSON paths', context => {
      // given
      const {importer, eventbus} = context;
      const config = createTestConfig();
      config.actions = [createAction('1', 'Show')];
      config.eventActions = [{...createAction('2', 'Show'), eventName: 'evt'}];
      const resolver = new ConfigurationResolver(
        importer as unknown as ISimpleResourceImporter,
        eventbus
      );

      // test + expect
      expect(() =>
        resolver.process(config, createMockActionRegistryListener() as any)
      ).toThrowError(
        "Duplicate action name 'Show' at actions[0].name and eventActions[0].name"
      );
    });

    test<ConfigurationResolverSuiteContext>('given actions with unique names, when process is called, then the lookup contains every action', context => {
      // given
      const {importer, eventbus} = context;
      const config = createTestConfig();
      config.actions = [createAction('1', 'Show'), createAction('2', 'Hide')];
      config.eventActions = [{...createAction('3', 'Evt'), eventName: 'evt'}];
      const resolver = new ConfigurationResolver(
        importer as unknown as ISimpleResourceImporter,
        eventbus
      );

      // test
      const [lookup] = resolver.process(
        config,
        createMockActionRegistryListener() as any
      );

      // expect
      expect(Object.keys(lookup)).toEqual(['Show', 'Hide', 'Evt']);
    });
  });

  describe<ConfigurationResolverSuiteContext>('placeholder order', () => {
    test<ConfigurationResolverSuiteContext>('given config with id config:layoutTemplate declared before layoutTemplate template:main, when process is called, then resolved id equals the imported template html', context => {
      // given
      const {importer, eventbus} = context;
      const config = createTestConfig();
      config.id = 'config:layoutTemplate';
      config.layoutTemplate = 'template:main';
      importer.addEntry('main', '<div>main</div>');
      const resolver = new ConfigurationResolver(
        importer as unknown as ISimpleResourceImporter,
        eventbus
      );

      // test
      const [, processedConfig] = resolver.process(config);

      // expect
      expect(processedConfig.id).toBe('<div>main</div>');
      expect(processedConfig.layoutTemplate).toBe('<div>main</div>');
    });

    test<ConfigurationResolverSuiteContext>('given a config: placeholder that points at another config: placeholder declared later, when process is called, then both resolve to the final value', context => {
      // given
      const {importer, eventbus} = context;
      const config = createTestConfig();
      config.id = 'config:containerSelector';
      config.containerSelector = 'config:engine.systemName';
      const resolver = new ConfigurationResolver(
        importer as unknown as ISimpleResourceImporter,
        eventbus
      );

      // test
      const [, processedConfig] = resolver.process(config);

      // expect
      expect(processedConfig.id).toBe('TestEngine');
      expect(processedConfig.containerSelector).toBe('TestEngine');
    });

    test<ConfigurationResolverSuiteContext>('given two config: placeholders that point at each other, when process is called, then it throws a circular placeholder error', context => {
      // given
      const {importer, eventbus} = context;
      const config = createTestConfig();
      config.id = 'config:containerSelector';
      config.containerSelector = 'config:id';
      const resolver = new ConfigurationResolver(
        importer as unknown as ISimpleResourceImporter,
        eventbus
      );

      // test + expect
      expect(() => resolver.process(config)).toThrowError(
        /Circular config: placeholder/
      );
    });
  });
  describe<ConfigurationResolverSuiteContext>('non-operation exports', () => {
    function createTimelineWithOperation(systemName: string): any {
      return {
        id: 't1',
        uri: 'uri',
        type: 'animation',
        duration: 10,
        loop: false,
        selector: '#sel',
        timelineActions: [
          {
            id: 'a1',
            name: 'A',
            duration: {start: 0, end: 1},
            startOperations: [{id: 'o1', systemName, operationData: {}}],
            endOperations: [],
          },
        ],
      };
    }

    test<ConfigurationResolverSuiteContext>('given a timeline action whose startOperations contains systemName LabelController, when process is called with EligiusResourceImporter, then it throws naming the JSON path and pointing at addControllerToElement', context => {
      // given
      const {eventbus} = context;
      const config = createTestConfig();
      config.timelineProviderSettings = {
        animation: {positionSource: {systemName: 'RafPositionSource'}},
      };
      config.timelines = [createTimelineWithOperation('LabelController')];
      const resolver = new ConfigurationResolver(
        new EligiusResourceImporter(),
        eventbus
      );

      // test + expect
      expect(() => resolver.process(config)).toThrowError(
        "Unknown operation 'LabelController' at timelines[0].timelineActions[0].startOperations[0].systemName. 'LabelController' is a controller, not an operation: attach it with the addControllerToElement operation."
      );
    });

    test<ConfigurationResolverSuiteContext>('given an importer without name lists that returns a class for an operation name, when process is called, then it throws naming the JSON path', context => {
      // given
      const {importer, eventbus} = context;
      importer.addEntry('SomeClass', class SomeClass {});
      const config = createTestConfig();
      config.actions = [
        {
          id: 'a',
          name: 'A',
          startOperations: [{id: 'o', systemName: 'SomeClass'}],
          endOperations: [],
        },
      ];
      const resolver = new ConfigurationResolver(
        importer as unknown as ISimpleResourceImporter,
        eventbus
      );

      // test + expect
      expect(() => resolver.process(config)).toThrowError(
        "Unknown operation 'SomeClass' at actions[0].startOperations[0].systemName. 'SomeClass' is a class, not an operation function."
      );
    });
  });

  describe<ConfigurationResolverSuiteContext>('structural validation', () => {
    function createTimeline(timelineAction: any): any {
      return {
        id: 't1',
        uri: 'uri',
        type: 'animation',
        duration: 10,
        loop: false,
        selector: '#sel',
        timelineActions: [timelineAction],
      };
    }

    function createResolver(context: ConfigurationResolverSuiteContext) {
      return new ConfigurationResolver(
        context.importer as unknown as ISimpleResourceImporter,
        context.eventbus
      );
    }

    function createValidConfig() {
      const config = createTestConfig();
      config.timelineProviderSettings = {
        animation: {positionSource: {systemName: 'RafPositionSource'}},
      };
      return config;
    }

    test<ConfigurationResolverSuiteContext>('given a timeline action configuration without a duration, when process is called, then it throws an error naming timelines[0].timelineActions[0].duration', context => {
      // given
      const config = createValidConfig();
      config.timelines = [
        createTimeline({
          id: 'a',
          name: 'Intro',
          startOperations: [],
          endOperations: [],
        }),
      ];

      // test + expect
      expect(() => createResolver(context).process(config)).toThrowError(
        'Invalid configuration at timelines[0].timelineActions[0].duration: expected {start: number, end?: number}, got undefined.'
      );
    });

    test<ConfigurationResolverSuiteContext>('given a timeline action whose duration end is lower than its start, when process is called, then it throws naming the end', context => {
      // given
      const config = createValidConfig();
      config.timelines = [
        createTimeline({
          id: 'a',
          name: 'Intro',
          duration: {start: 5, end: 2},
          startOperations: [],
          endOperations: [],
        }),
      ];

      // test + expect
      expect(() => createResolver(context).process(config)).toThrowError(
        'Invalid configuration at timelines[0].timelineActions[0].duration.end: end (2) must not be lower than start (5).'
      );
    });

    test<ConfigurationResolverSuiteContext>('given a timeline action with a negative start, when process is called, then it throws naming the start', context => {
      // given
      const config = createValidConfig();
      config.timelines = [
        createTimeline({
          id: 'a',
          name: 'Intro',
          duration: {start: -1},
          startOperations: [],
          endOperations: [],
        }),
      ];

      // test + expect
      expect(() => createResolver(context).process(config)).toThrowError(
        'Invalid configuration at timelines[0].timelineActions[0].duration.start: expected a number >= 0, got -1.'
      );
    });

    test<ConfigurationResolverSuiteContext>('given a timeline action with an open end of -1 or no end, when process is called, then it resolves', context => {
      // given
      const config = createValidConfig();
      const timeline = createTimeline({
        id: 'a',
        name: 'Intro',
        duration: {start: 0, end: -1},
        startOperations: [],
        endOperations: [],
      });
      timeline.timelineActions.push({
        id: 'b',
        name: 'Outro',
        duration: {start: 0},
        startOperations: [],
        endOperations: [],
      });
      config.timelines = [timeline];

      // test
      const [, resolved] = createResolver(context).process(config);

      // expect
      expect(resolved.timelines[0].timelineActions.length).toBe(2);
    });

    test<ConfigurationResolverSuiteContext>('given an action without startOperations, when process is called, then it throws naming actions[0].startOperations', context => {
      // given
      const config = createValidConfig();
      config.actions = [{id: 'a', name: 'A', endOperations: []} as any];

      // test + expect
      expect(() => createResolver(context).process(config)).toThrowError(
        'Invalid configuration at actions[0].startOperations: expected an array, got undefined.'
      );
    });

    test<ConfigurationResolverSuiteContext>('given an init action without endOperations, when process is called, then it throws naming initActions[0].endOperations', context => {
      // given
      const config = createValidConfig();
      config.initActions = [{id: 'a', name: 'A', startOperations: []} as any];

      // test + expect
      expect(() => createResolver(context).process(config)).toThrowError(
        'Invalid configuration at initActions[0].endOperations: expected an array, got undefined.'
      );
    });

    test<ConfigurationResolverSuiteContext>('given a configuration without actions and a timeline without timelineActions, when process is called, then it throws naming the missing list', context => {
      // given
      const withoutActions = createValidConfig();
      delete (withoutActions as any).actions;
      const withoutTimelineActions = createValidConfig();
      withoutTimelineActions.timelines = [
        {...createTimeline({}), timelineActions: undefined},
      ];

      // test + expect
      expect(() =>
        createResolver(context).process(withoutActions)
      ).toThrowError(
        'Invalid configuration at actions: expected an array, got undefined.'
      );
      expect(() =>
        createResolver(context).process(withoutTimelineActions)
      ).toThrowError(
        'Invalid configuration at timelines[0].timelineActions: expected an array, got undefined.'
      );
    });

    test<ConfigurationResolverSuiteContext>('given eventActions that is not an array, when process is called, then it throws naming eventActions', context => {
      // given
      const config = createValidConfig();
      config.eventActions = {} as any;

      // test + expect
      expect(() =>
        createResolver(context).process(
          config,
          createMockActionRegistryListener() as any
        )
      ).toThrowError(
        'Invalid configuration at eventActions: expected an array, got an object.'
      );
    });

    test<ConfigurationResolverSuiteContext>('given a mediaplayer timeline and provider settings for animation only, when process is called, then it throws naming the missing provider settings', context => {
      // given
      const config = createValidConfig();
      config.timelines = [
        {...createTimeline({}), type: 'mediaplayer', timelineActions: []},
      ];

      // test + expect
      expect(() => createResolver(context).process(config)).toThrowError(
        "Missing timeline provider settings at timelineProviderSettings.mediaplayer for timelines[0] (type 'mediaplayer')."
      );
    });

    test<ConfigurationResolverSuiteContext>('given timelineProviderSettings that is not an object, when process is called, then it throws naming timelineProviderSettings', context => {
      // given
      const config = createValidConfig();
      config.timelineProviderSettings = undefined;

      // test + expect
      expect(() => createResolver(context).process(config)).toThrowError(
        /^Configuration incomplete: it needs to have at least one timeline provider setting at timelineProviderSettings/
      );
    });
  });

  describe<ConfigurationResolverSuiteContext>('event action registration', () => {
    test<ConfigurationResolverSuiteContext>('given action Show and eventAction Show, when process throws for the duplicate name, then the event action is not registered', context => {
      // given
      const {importer, eventbus} = context;
      const config = createTestConfig();
      config.actions = [
        {id: '1', name: 'Show', startOperations: [], endOperations: []},
      ];
      config.eventActions = [
        {id: '2', name: 'Show', eventName: 'lang-changed', startOperations: []},
      ];
      const registry = createMockActionRegistryListener();
      const resolver = new ConfigurationResolver(
        importer as unknown as ISimpleResourceImporter,
        eventbus
      );

      // test
      expect(() => resolver.process(config, registry as any)).toThrowError(
        /Duplicate action name 'Show'/
      );

      // expect
      expect(registry.registerAction).not.toHaveBeenCalled();
    });

    test<ConfigurationResolverSuiteContext>('given a valid event action, when process is called, then it is registered once with its event name and topic', context => {
      // given
      const {importer, eventbus} = context;
      const config = createTestConfig();
      config.eventActions = [
        {
          id: '2',
          name: 'OnLang',
          eventName: 'lang-changed',
          eventTopic: 'topic',
          startOperations: [],
        },
      ];
      const registry = createMockActionRegistryListener();
      const resolver = new ConfigurationResolver(
        importer as unknown as ISimpleResourceImporter,
        eventbus
      );

      // test
      const [lookup] = resolver.process(config, registry as any);

      // expect
      expect(registry.registerAction).toHaveBeenCalledTimes(1);
      expect(registry.registerAction).toHaveBeenCalledWith(
        lookup.OnLang,
        'lang-changed',
        'topic'
      );
    });
  });

  describe<ConfigurationResolverSuiteContext>('placeholder errors', () => {
    test<ConfigurationResolverSuiteContext>('given an importer that returns an empty record for an unknown template, when process is called with layoutTemplate template:mian, then it throws naming the placeholder and the JSON path', context => {
      // given
      const {eventbus} = context;
      const config = createTestConfig();
      config.layoutTemplate = 'template:mian';
      const resolver = new ConfigurationResolver(
        {import: () => ({})},
        eventbus
      );

      // test + expect
      expect(() => resolver.process(config)).toThrowError(
        "Unable to resolve placeholder 'template:mian' at layoutTemplate: unknown name 'mian'."
      );
    });

    test<ConfigurationResolverSuiteContext>('given an importer that returns an empty record for a json import inside an operation, when process is called, then the error names the operation data path', context => {
      // given
      const {eventbus} = context;
      const config = createTestConfig();
      config.actions = [
        {
          id: 'a',
          name: 'A',
          startOperations: [
            {
              id: 'o',
              systemName: 'setData',
              operationData: {properties: 'json:missing'},
            },
          ],
          endOperations: [],
        },
      ];
      const resolver = new ConfigurationResolver(
        {import: () => ({})},
        eventbus
      );

      // test + expect
      expect(() => resolver.process(config)).toThrowError(
        "Unable to resolve placeholder 'json:missing' at actions[0].startOperations[0].operationData.properties: unknown name 'missing'."
      );
    });

    test<ConfigurationResolverSuiteContext>('given an importer that registers a template with an undefined value, when process is called, then the placeholder resolves to undefined without an error', context => {
      // given
      const {eventbus} = context;
      const config = createTestConfig();
      config.layoutTemplate = 'template:empty';
      const resolver = new ConfigurationResolver(
        {import: (name: string) => ({[name]: undefined})},
        eventbus
      );

      // test
      const [, resolved] = resolver.process(config);

      // expect
      expect(resolved.layoutTemplate).toBeUndefined();
    });

    test<ConfigurationResolverSuiteContext>('given a config: placeholder whose last segment does not exist, when process is called, then it throws naming the placeholder and the JSON path', context => {
      // given
      const {importer, eventbus} = context;
      const config = createTestConfig();
      config.containerSelector = 'config:engine.systemNam';
      const resolver = new ConfigurationResolver(
        importer as unknown as ISimpleResourceImporter,
        eventbus
      );

      // test + expect
      expect(() => resolver.process(config)).toThrowError(
        "Unable to resolve placeholder 'config:engine.systemNam' at containerSelector: the configuration has no value at 'engine.systemNam'."
      );
    });

    test<ConfigurationResolverSuiteContext>('given a config: placeholder with a missing intermediate segment inside an array, when process is called, then it throws naming the placeholder and the JSON path and keeps the cause', context => {
      // given
      const {importer, eventbus} = context;
      const config = createTestConfig();
      config.cssFiles = ['a.css', 'config:missing.file'];
      const resolver = new ConfigurationResolver(
        importer as unknown as ISimpleResourceImporter,
        eventbus
      );

      // test
      let error: any;
      try {
        resolver.process(config);
      } catch (e) {
        error = e;
      }

      // expect
      expect(error.message).toMatch(
        /^Unable to resolve placeholder 'config:missing\.file' at cssFiles\[1\]: .*'missing\.file' cannot be resolved/i
      );
      expect(error.cause).toBeInstanceOf(Error);
    });
  });

  describe<ConfigurationResolverSuiteContext>('input ownership', () => {
    test<ConfigurationResolverSuiteContext>('given a configuration, when process is called, then the resolved cssFiles is a copy of the input list', context => {
      // given
      const {importer, eventbus} = context;
      const config = createTestConfig();
      config.cssFiles = ['a.css'];
      const resolver = new ConfigurationResolver(
        importer as unknown as ISimpleResourceImporter,
        eventbus
      );

      // test
      const [, resolved] = resolver.process(config);

      // expect
      expect(resolved.cssFiles).toEqual(['a.css']);
      expect(resolved.cssFiles).not.toBe(config.cssFiles);
    });

    test<ConfigurationResolverSuiteContext>('given a json: import whose value contains placeholder strings, when the same configuration is processed twice, then the importer-owned value is never rewritten', context => {
      // given
      const {importer, eventbus} = context;
      const owned = {html: 'template:other', id: 'config:engine.systemName'};
      importer.addEntry('data', owned);
      importer.addEntry('other', '<p>other</p>');
      const config = createTestConfig();
      (config as any).timelineFlow = 'json:data';
      const resolver = new ConfigurationResolver(
        importer as unknown as ISimpleResourceImporter,
        eventbus
      );

      // test
      resolver.process(config);
      resolver.process(config);

      // expect
      expect(owned).toEqual({
        html: 'template:other',
        id: 'config:engine.systemName',
      });
      expect((config as any).timelineFlow).not.toBe(owned);
    });
  });
});
