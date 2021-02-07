import { expect } from 'chai';
import { ConfigurationResolver } from '../configuration/configuration-resolver';
import { IEngineConfiguration } from '../configuration/types';

class MockImporter {
  lookup: any;
  constructor() {
    this.lookup = {};
  }

  import(name) {
    return this.lookup[name] ? { [name]: this.lookup[name] } : { [name]: {} };
  }

  addEntry(name, value) {
    this.lookup[name] = value;
  }
}

class MockEventbus {
  constructor() {}
}

class MockActionRegistryListener {
  eventAction: any;
  eventName: string;
  eventTopic: string;

  registerAction(eventAction, eventName, eventTopic) {
    this.eventAction = eventAction;
    this.eventName = eventName;
    this.eventTopic = eventTopic;
  }
}

function createTestConfig(): IEngineConfiguration {
  return {
    id: 'testId',
    engine: { systemName: 'TestEngine' },
    timelineProviderSettings: {} as any,
    containerSelector: 'containerSelector',
    language: 'nl',
    layoutTemplate: 'layoutTemplate',
    availableLanguages: [],
    initActions: [],
    actions: [],
    eventActions: undefined,
    timelines: [],
    timelineFlow: undefined,
    labels: [],
  };
}

describe('ConfigurationResolver', () => {
  let importer = null;
  let eventbus = null;

  beforeEach(() => {
    importer = new MockImporter();
    eventbus = new MockEventbus();
  });

  it('should create', () => {
    // given
    // test
    const resolver = new ConfigurationResolver(importer as any, eventbus as any);

    // expect
    expect(resolver).to.not.be.null;
  });

  it('should initialize event actions', () => {
    // give
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
    const resolver = new ConfigurationResolver(importer as any, eventbus as any);
    const registry = new MockActionRegistryListener();

    // test
    resolver.process(config, registry as any);

    // expect
    expect(registry.eventAction).to.not.undefined;
    expect(registry.eventName).to.equal('testEvent');
    expect(registry.eventTopic).to.equal('testTopic');
  });

  it('should initialize initActions', () => {
    // give
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
    const resolver = new ConfigurationResolver(importer as any, eventbus as any);

    // test
    const [, processedConfig] = resolver.process(config);

    // expect
    const actionConfig = config.initActions[0];
    const resolvedAction = processedConfig.initActions[0];

    expect(resolvedAction).to.not.be.undefined;
    expect(resolvedAction.id).to.equal(actionConfig.id);
    expect(resolvedAction.name).to.equal(actionConfig.name);
    expect(resolvedAction.startOperations.length).to.equal(actionConfig.startOperations.length);
    expect(resolvedAction.endOperations.length).to.equal(actionConfig.endOperations.length);

    let operationConfig = actionConfig.startOperations[0];
    let resolvedOperation = resolvedAction.startOperations[0];

    expect(resolvedOperation.instance).to.not.be.undefined;
    expect(resolvedOperation.id).to.equal(operationConfig.id);
    expect(resolvedOperation.systemName).to.equal(operationConfig.systemName);
    expect(resolvedOperation.operationData).to.eql(operationConfig.operationData);

    operationConfig = actionConfig.endOperations[0];
    resolvedOperation = resolvedAction.endOperations[0];

    expect(resolvedOperation.instance).to.not.be.undefined;
    expect(resolvedOperation.id).to.equal(operationConfig.id);
    expect(resolvedOperation.systemName).to.equal(operationConfig.systemName);
    expect(resolvedOperation.operationData).to.eql(operationConfig.operationData);
  });

  it('should initialize actions', () => {
    // give
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
    const resolver = new ConfigurationResolver(importer as any, eventbus as any);

    // test
    const [actionsLookup, processedConfig] = resolver.process(config);

    // expect
    const resolvedAction = actionsLookup['TestAction'];
    expect(resolvedAction).to.not.be.null;
    expect(processedConfig.actions).to.not.be.undefined;
    expect(processedConfig.actions[0]).to.not.be.undefined;
    expect(processedConfig.actions[0].startOperations[0].instance).to.not.be.undefined;
    expect(processedConfig.actions[0].endOperations[0].instance).to.not.be.undefined;
  });

  it('should initialize timeline actions', () => {
    // give
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
    const resolver = new ConfigurationResolver(importer as any, eventbus as any);

    // test
    const [, processedConfig] = resolver.process(config);

    // expect
    const timeline = config.timelines[0];
    const resolvedTimeline = processedConfig.timelines[0];

    expect(timeline.id).to.equal(resolvedTimeline.id);
    expect(timeline.uri).to.equal(resolvedTimeline.uri);
    expect(timeline.type).to.equal(resolvedTimeline.type);
    expect(timeline.duration).to.equal(resolvedTimeline.duration);
    expect(timeline.loop).to.equal(resolvedTimeline.loop);
    expect(timeline.selector).to.equal(resolvedTimeline.selector);

    const actionConfig = timeline.timelineActions[0];
    const resolvedAction: any = resolvedTimeline.timelineActions[0];
    expect(resolvedAction).to.not.null;
    expect(resolvedAction.eventbus).to.equal(eventbus);
    expect(resolvedAction.id).to.equal(actionConfig.id);
    expect(resolvedAction.name).to.equal(actionConfig.name);
  });

  it('should resolve config: properties', () => {
    // give
    const config = createTestConfig();
    config.id = 'config:engine.systemName';
    const resolver = new ConfigurationResolver(importer as any, eventbus as any);

    // test
    const [, processedConfig] = resolver.process(config);

    // expect
    expect(processedConfig.id).to.equal(config.engine.systemName);
  });

  it('should resolve json: properties', () => {
    // give
    const config = createTestConfig();
    config.id = 'json:test';
    const resolver = new ConfigurationResolver(importer as any, eventbus as any);
    importer.addEntry('test', { test: 'testValue' });

    // test
    resolver.process(config);

    // expect
    expect((config.id as any).test).to.equal('testValue');
  });

  it('should resolve template: properties', () => {
    // give
    const config = createTestConfig();
    config.layoutTemplate = 'template:test';

    const resolver = new ConfigurationResolver(importer as any, eventbus as any);
    importer.addEntry('test', '<div>This is my template</div>');

    // test
    resolver.process(config);

    // expect
    expect(config.layoutTemplate).to.equal('<div>This is my template</div>');
  });
});
