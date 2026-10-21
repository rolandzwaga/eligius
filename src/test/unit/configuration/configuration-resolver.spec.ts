import {ConfigurationResolver} from '@configuration/configuration-resolver.ts';
import type {IEngineConfiguration} from '@configuration/types.ts';
import type {Eventbus} from '@eventbus/index.ts';
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
});
