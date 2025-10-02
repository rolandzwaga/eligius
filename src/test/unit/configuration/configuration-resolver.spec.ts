import {expect} from 'chai';
import {beforeEach, describe, type TestContext, test} from 'vitest';
import {ConfigurationResolver} from '../../../configuration/configuration-resolver.ts';
import type {IEngineConfiguration} from '../../../configuration/types.ts';
import type {Eventbus} from '../../../eventbus/index.ts';
import type {ISimpleResourceImporter} from '../../../types.ts';

class MockImporter {
  lookup: any;
  constructor() {
    this.lookup = {};
  }

  import(name: string) {
    return this.lookup[name] ? {[name]: this.lookup[name]} : {[name]: {}};
  }

  addEntry(name: string, value: any) {
    this.lookup[name] = value;
  }
}

class MockEventbus {
  constructor() {}
}

class MockActionRegistryListener {
  eventAction: any;
  eventName: string = '';
  eventTopic?: string;

  registerAction(eventAction: any, eventName: string, eventTopic?: string) {
    this.eventAction = eventAction;
    this.eventName = eventName;
    this.eventTopic = eventTopic;
  }
}

function createTestConfig(): IEngineConfiguration {
  return {
    id: 'testId',
    engine: {systemName: 'TestEngine'},
    timelineProviderSettings: {} as any,
    containerSelector: 'containerSelector',
    language: 'nl-NL',
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

type ConfigurationResolverSuiteContext = {
  importer: ISimpleResourceImporter;
  eventbus: Eventbus;
} & TestContext;

describe.concurrent<ConfigurationResolverSuiteContext>(
  'ConfigurationResolver',
  () => {
    beforeEach<ConfigurationResolverSuiteContext>(context => {
      context.importer = new MockImporter();
      context.eventbus = new MockEventbus() as Eventbus;
    });
    test<ConfigurationResolverSuiteContext>('should create', context => {
      // given
      const {importer, eventbus} = context;
      // test
      const resolver = new ConfigurationResolver(importer, eventbus);

      // expect
      expect(resolver).to.not.be.null;
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
      const resolver = new ConfigurationResolver(importer, eventbus);
      const registry = new MockActionRegistryListener();

      // test
      resolver.process(config, registry as any);

      // expect
      expect(registry.eventAction).to.not.undefined;
      expect(registry.eventName).to.equal('testEvent');
      expect(registry.eventTopic).to.equal('testTopic');
    });
    test<ConfigurationResolverSuiteContext>('should initialize initActions', context => {
      // give
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
      const resolver = new ConfigurationResolver(importer, eventbus);

      // test
      const [, processedConfig] = resolver.process(config);

      // expect
      const actionConfig = config.initActions[0];
      const resolvedAction = processedConfig.initActions[0];

      expect(resolvedAction).to.not.be.undefined;
      expect(resolvedAction.id).to.equal(actionConfig.id);
      expect(resolvedAction.name).to.equal(actionConfig.name);
      expect(resolvedAction.startOperations.length).to.equal(
        actionConfig.startOperations.length
      );
      expect(resolvedAction.endOperations.length).to.equal(
        actionConfig.endOperations.length
      );

      let operationConfig = actionConfig.startOperations[0];
      let resolvedOperation = resolvedAction.startOperations[0];

      expect(resolvedOperation.instance).to.not.be.undefined;
      expect(resolvedOperation.id).to.equal(operationConfig.id);
      expect(resolvedOperation.systemName).to.equal(operationConfig.systemName);
      expect(resolvedOperation.operationData).to.eql(
        operationConfig.operationData
      );

      operationConfig = actionConfig.endOperations[0];
      resolvedOperation = resolvedAction.endOperations[0];

      expect(resolvedOperation.instance).to.not.be.undefined;
      expect(resolvedOperation.id).to.equal(operationConfig.id);
      expect(resolvedOperation.systemName).to.equal(operationConfig.systemName);
      expect(resolvedOperation.operationData).to.eql(
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
      const resolver = new ConfigurationResolver(importer, eventbus);

      // test
      const [actionsLookup, processedConfig] = resolver.process(config);

      // expect
      const resolvedAction = actionsLookup['TestAction'];
      expect(resolvedAction).to.not.be.null;
      expect(processedConfig.actions).to.not.be.undefined;
      expect(processedConfig.actions[0]).to.not.be.undefined;
      expect(processedConfig.actions[0].startOperations[0].instance).to.not.be
        .undefined;
      expect(processedConfig.actions[0].endOperations[0].instance).to.not.be
        .undefined;
    });
    test<ConfigurationResolverSuiteContext>('should initialize timeline actions', context => {
      // give
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
      const resolver = new ConfigurationResolver(importer, eventbus);

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
    test<ConfigurationResolverSuiteContext>('should resolve config: properties', context => {
      // given
      const {importer, eventbus} = context;
      const config = createTestConfig();
      config.id = 'config:engine.systemName';
      const resolver = new ConfigurationResolver(importer, eventbus);

      // test
      const [, processedConfig] = resolver.process(config);

      // expect
      expect(processedConfig.id).to.equal(config.engine.systemName);
    });
    test<ConfigurationResolverSuiteContext>('should resolve json: properties', context => {
      // given
      const {importer, eventbus} = context;
      const config = createTestConfig();
      config.id = 'json:test';
      const resolver = new ConfigurationResolver(importer, eventbus);
      (importer as unknown as MockImporter).addEntry('test', {
        test: 'testValue',
      });

      // test
      resolver.process(config);

      // expect
      expect((config.id as any).test).to.equal('testValue');
    });
    test<ConfigurationResolverSuiteContext>('should resolve template: properties', context => {
      // give
      const {importer, eventbus} = context;
      const config = createTestConfig();
      config.layoutTemplate = 'template:test';

      const resolver = new ConfigurationResolver(importer, eventbus);
      (importer as unknown as MockImporter).addEntry(
        'test',
        '<div>This is my template</div>'
      );

      // test
      resolver.process(config);

      // expect
      expect(config.layoutTemplate).to.equal('<div>This is my template</div>');
    });
  }
);
