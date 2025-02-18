import { expect } from 'chai';
import { suite } from 'uvu';
import { ConfigurationFactory } from '../../../../configuration/api/index.ts';
import {
  EndableActionEditor,
  OperationEditor,
} from '../../../../configuration/api/action-editor.ts';

const EndableActionEditorSuite = suite<{
  configurationFactory: ConfigurationFactory;
  actionConfig: any;
  endableActionEditor: EndableActionEditor;
}>('EndableActionEditor');

EndableActionEditorSuite.before.each((context) => {
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

EndableActionEditorSuite('should return an operation editor', (context) => {
  // given
  const { endableActionEditor } = context;

  // test
  const editor = endableActionEditor.editEndOperation('test');

  // expect
  expect(editor).to.be.an.instanceOf(OperationEditor);
});

EndableActionEditorSuite(
  'should throw an operation not found error',
  (context) => {
    // given
    const { endableActionEditor } = context;

    // expect
    expect(() => endableActionEditor.editEndOperation('test2')).throws(
      'operation not found for id test2'
    );
  }
);

EndableActionEditorSuite(
  'should remove the operation with the given id',
  (context) => {
    // given
    const { endableActionEditor } = context;
    // test
    endableActionEditor.removeEndOperation('test');

    // expect
    endableActionEditor.getConfiguration((config) => {
      expect(config.endOperations.length).to.equal(0);
      return undefined;
    });
  }
);

EndableActionEditorSuite.run();
