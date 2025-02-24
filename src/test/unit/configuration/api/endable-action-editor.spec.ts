import { expect } from 'chai';
import { beforeEach, describe, test, type TestContext } from 'vitest';
import {
  EndableActionEditor,
  OperationEditor,
} from '../../../../configuration/api/action-editor.ts';
import { ConfigurationFactory } from '../../../../configuration/api/index.ts';

type EndableActionEditorSuiteContext = {
  configurationFactory: ConfigurationFactory;
  actionConfig: any;
  endableActionEditor: EndableActionEditor;
} & TestContext;

function withContext<T>(ctx: unknown): asserts ctx is T { }
describe.concurrent<EndableActionEditorSuiteContext>('EndableActionEditor', () => {
  beforeEach((context) => {
    withContext<EndableActionEditorSuiteContext>(context);

    context.configurationFactory = {} as ConfigurationFactory;
    context.actionConfig = {
      id: '111-222-333',
      name: 'name',
      startOperations: [],
      endOperations: [
        {
          id: 'test',
          systemName: 'test',
          operationData: {},
        },
      ],
    };
    context.endableActionEditor = new EndableActionEditor(
      context.actionConfig,
      context.configurationFactory
    );
  });
  test<EndableActionEditorSuiteContext>('should return an operation editor', (context) => {
    // given
    const { endableActionEditor } = context;

    // test
    const editor = endableActionEditor.editEndOperation('test');

    // expect
    expect(editor).to.be.an.instanceOf(OperationEditor);
  });
  test<EndableActionEditorSuiteContext>('should throw an operation not found error', (context) => {
    // given
    const { endableActionEditor } = context;

    // expect
    expect(() => endableActionEditor.editEndOperation('test2')).throws(
      'operation not found for id test2'
    );
  });
  test<EndableActionEditorSuiteContext>('should remove the operation with the given id', (context) => {
    // given
    const { endableActionEditor } = context;
    // test
    endableActionEditor.removeEndOperation('test');

    // expect
    endableActionEditor.getConfiguration((config) => {
      expect(config.endOperations.length).to.equal(0);
      return undefined;
    });
  });
});
