import {ConfigurationResolver} from '@configuration/configuration-resolver.ts';
import type {IEngineConfiguration} from '@configuration/types.ts';
import type {Eventbus} from '@eventbus/index.ts';
import {beforeEach, describe, expect, type TestContext, test, vi} from 'vitest';
import type {ISimpleResourceImporter} from '../../../types.ts';

function createMockImporter() {
  const lookup: Record<string, any> = {};
  return {
    lookup,
    import: vi.fn((name: string) => {
      return lookup[name] ? {[name]: lookup[name]} : {[name]: {}};
    }),
    addEntry(name: string, value: any) {
      lookup[name] = value;
    },
  };
}

function createMockEventbus() {
  return {};
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
    labels: [],
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
});
