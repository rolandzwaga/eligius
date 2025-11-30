import {
  ActionEditor,
  OperationEditor,
} from '@configuration/api/action-editor.ts';
import type {ConfigurationFactory} from '@configuration/api/index.ts';
import type {IActionConfiguration} from '@configuration/types.ts';
import {beforeEach, describe, expect, type TestContext, test} from 'vitest';

type ActionEditorSuiteContext = {
  configurationFactory: ConfigurationFactory;
  actionConfig: any;
  actionEditor: ActionEditor;
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T {}
describe<ActionEditorSuiteContext>('ActionEditorSuite', () => {
  beforeEach(context => {
    withContext<ActionEditorSuiteContext>(context);

    context.configurationFactory = {} as unknown as ConfigurationFactory;
    context.actionConfig = {
      id: '111-222-333',
      name: 'name',
      startOperations: [],
    } as any;
    context.actionEditor = new ActionEditor(
      context.actionConfig,
      context.configurationFactory
    );
  });
  test<ActionEditorSuiteContext>('should initialize properly', context => {
    // given
    const {actionEditor} = context;
    let config = {};

    // test
    actionEditor.getConfiguration(cf => (config = cf));

    // expect
    expect(config).toEqual(context.actionConfig);
  });
  test<ActionEditorSuiteContext>('should set the name', context => {
    // given
    const {actionEditor} = context;

    // test
    actionEditor.setName('TestName');

    // expect
    expect(actionEditor.getName()).toBe('TestName');
  });
  test<ActionEditorSuiteContext>('should return an operation editor', context => {
    // given
    const {actionEditor} = context;
    actionEditor.addStartOperation('addClass', {}, 'test');

    // test
    const editor = actionEditor.editStartOperation('test');

    // expect
    expect(editor).toBeInstanceOf(OperationEditor);
  });
  test<ActionEditorSuiteContext>('should throw an operation not found error', context => {
    // given
    const {actionEditor} = context;

    // expect
    expect(() => actionEditor.editStartOperation('test')).toThrow(
      'start operation not found for id test'
    );
  });
  test<ActionEditorSuiteContext>('should remove the operation with the given id', context => {
    // given
    const {actionEditor} = context;
    actionEditor.addStartOperation('addClass', {}, 'test');

    // test
    actionEditor.removeStartOperation('test');

    // expect
    actionEditor.getConfiguration(config => {
      expect(config.startOperations.length).toBe(0);
      return undefined;
    });
  });
  test<ActionEditorSuiteContext>('should move the start operation with given id up', context => {
    // given
    const {actionEditor} = context;
    const op1 = {
      id: 'test',
      systemName: 'test',
      operationData: {},
    };
    const op2 = {
      id: 'test2',
      systemName: 'test2',
      operationData: {},
    };
    actionEditor.getConfiguration(config => {
      config.startOperations.push(op1, op2);
      return config;
    });

    // test
    actionEditor.moveStartOperation('test', 'up');

    // expect
    actionEditor.getConfiguration(config => {
      expect(config.startOperations.findIndex(x => x.id === op1.id)).toBe(1);
      return undefined;
    });
  });
  test<ActionEditorSuiteContext>('should move the start operation with given id down', context => {
    // given
    const {actionEditor} = context;
    const op1 = {
      id: 'test',
      systemName: 'test',
      operationData: {},
    };
    const op2 = {
      id: 'test2',
      systemName: 'test2',
      operationData: {},
    };
    actionEditor.getConfiguration(config => {
      config.startOperations.push(op1, op2);
      return config;
    });

    // test
    actionEditor.moveStartOperation('test2', 'down');

    // expect
    actionEditor.getConfiguration(config => {
      expect(config.startOperations.findIndex(x => x.id === op2.id)).toBe(0);
      return undefined;
    });
  });
  test<ActionEditorSuiteContext>('should return the configuration editor', context => {
    // test
    const {actionEditor, configurationFactory} = context;
    const result = actionEditor.next();

    // expect
    expect(result).toBe(configurationFactory);
  });
  test<ActionEditorSuiteContext>('should pass the configuration to the getConfiguration callback', context => {
    // given
    const {actionEditor} = context;
    let config = null;

    // test
    actionEditor.getConfiguration(c => (config = c));

    // expect
    expect(config).not.toBeNull();
  });
  test<ActionEditorSuiteContext>('should substitute the actionConfig with the instance returned from the getConfiguration callback', context => {
    // given
    const {actionEditor} = context;
    const config: IActionConfiguration = {
      id: '888-777-666',
    } as unknown as IActionConfiguration;

    // test
    actionEditor.getConfiguration(_c => config);

    // expect
    actionEditor.getConfiguration(cf => {
      expect(config).toEqual(cf);
      return undefined;
    });
  });
});
