import { expect } from 'chai';
import { suite } from 'uvu';
import { ConfigurationFactory } from '../../../../configuration/api';
import {
  ActionEditor,
  OperationEditor,
} from '../../../../configuration/api/action-editor';
import { IActionConfiguration } from '../../../../configuration/types';

const ActionEditorSuite = suite<{
  configurationFactory: ConfigurationFactory;
  actionConfig: any;
  actionEditor: ActionEditor;
}>('ActionEditorSuite');

ActionEditorSuite.before.each((context) => {
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

ActionEditorSuite('should initialize properly', (context) => {
  // given
  const { actionEditor } = context;
  let config = {};

  // test
  actionEditor.getConfiguration((cf) => (config = cf));

  // expect
  expect(config).is.eql(context.actionConfig);
});

ActionEditorSuite('should set the name', (context) => {
  // given
  const { actionEditor } = context;

  // test
  actionEditor.setName('TestName');

  // expect
  expect(actionEditor.getName()).to.equal('TestName');
});

ActionEditorSuite('should return an operation editor', (context) => {
  // given
  const { actionEditor } = context;
  actionEditor.addStartOperation('addClass', {}, 'test');

  // test
  const editor = actionEditor.editStartOperation('test');

  // expect
  expect(editor).to.be.an.instanceOf(OperationEditor);
});

ActionEditorSuite('should throw an operation not found error', (context) => {
  // given
  const { actionEditor } = context;

  // expect
  expect(() => actionEditor.editStartOperation('test')).throws(
    'start operation not found for id test'
  );
});

ActionEditorSuite(
  'should remove the operation with the given id',
  (context) => {
    // given
    const { actionEditor } = context;
    actionEditor.addStartOperation('addClass', {}, 'test');

    // test
    actionEditor.removeStartOperation('test');

    // expect
    actionEditor.getConfiguration((config) => {
      expect(config.startOperations.length).to.equal(0);
      return undefined;
    });
  }
);

ActionEditorSuite(
  'should move the start operation with given id up',
  (context) => {
    // given
    const { actionEditor } = context;
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
    actionEditor.getConfiguration((config) => {
      config.startOperations.push(op1, op2);
      return config;
    });

    // test
    actionEditor.moveStartOperation('test', 'up');

    // expect
    actionEditor.getConfiguration((config) => {
      expect(config.startOperations.findIndex((x) => x.id === op1.id)).to.equal(
        1
      );
      return undefined;
    });
  }
);

ActionEditorSuite(
  'should move the start operation with given id down',
  (context) => {
    // given
    const { actionEditor } = context;
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
    actionEditor.getConfiguration((config) => {
      config.startOperations.push(op1, op2);
      return config;
    });

    // test
    actionEditor.moveStartOperation('test2', 'down');

    // expect
    actionEditor.getConfiguration((config) => {
      expect(config.startOperations.findIndex((x) => x.id === op2.id)).to.equal(
        0
      );
      return undefined;
    });
  }
);

ActionEditorSuite('should return the configuration editor', (context) => {
  // test
  const { actionEditor, configurationFactory } = context;
  const result = actionEditor.next();

  // expect
  expect(result).to.equal(configurationFactory);
});

ActionEditorSuite(
  'should pass the configuration to the getConfiguration callback',
  (context) => {
    // given
    const { actionEditor } = context;
    let config = null;

    // test
    actionEditor.getConfiguration((c) => (config = c));

    // expect
    expect(config).to.not.be.null;
  }
);

ActionEditorSuite(
  'should substitute the actionConfig with the instance returned from the getConfiguration callback',
  (context) => {
    // given
    const { actionEditor } = context;
    let config: IActionConfiguration = {
      id: '888-777-666',
    } as unknown as IActionConfiguration;

    // test
    actionEditor.getConfiguration((_c) => config);

    // expect
    actionEditor.getConfiguration((cf) => {
      expect(config).to.eql(cf);
      return undefined;
    });
  }
);

ActionEditorSuite.run();
