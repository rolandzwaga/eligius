import { expect } from 'chai';
import { ConfigurationFactory } from '../../../../configuration/api';
import {
  ActionEditor,
  OperationEditor,
} from '../../../../configuration/api/action-editor';
import { IActionConfiguration } from '../../../../configuration/types';

describe('ActionEditor', () => {
  let actionEditor: ActionEditor = ({} as unknown) as ActionEditor;
  let configurationFactory: ConfigurationFactory = ({} as unknown) as ConfigurationFactory;
  let actionConfig: any;

  beforeEach(() => {
    configurationFactory = ({} as unknown) as ConfigurationFactory;
    actionConfig = {
      id: '111-222-333',
      name: 'name',
      startOperations: [],
    };
    actionEditor = new ActionEditor(actionConfig, configurationFactory);
  });

  it('should initialize properly', () => {
    // expect
    let config = {};
    actionEditor.getConfiguration(cf => (config = cf));
    expect(config).is.eql(actionConfig);
  });

  it('should set the name', () => {
    // given

    // test
    actionEditor.setName('TestName');

    // expect
    expect(actionEditor.getName()).to.equal('TestName');
  });

  it('should return an operation editor', () => {
    // given
    actionEditor.addStartOperation('addClass', {}, 'test');

    // test
    const editor = actionEditor.editStartOperation('test');

    // expect
    expect(editor).to.be.an.instanceOf(OperationEditor);
  });

  it('should throw an operation not found error', () => {
    // given
    let errorMessage = null;
    // test
    try {
      actionEditor.editStartOperation('test');
    } catch (e) {
      errorMessage = e.message;
    }

    // expect
    expect(errorMessage).to.equal('start operation not found for id test');
  });

  it('should remove the operation with the given id', () => {
    // given
    actionEditor.addStartOperation('addClass', {}, 'test');

    // test
    actionEditor.removeStartOperation('test');

    // expect
    actionEditor.getConfiguration(config => {
      expect(config.startOperations.length).to.equal(0);
      return undefined;
    });
  });

  it('should move the start operation with given id up', () => {
    // given
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
      expect(config.startOperations.findIndex(x => x.id === op1.id)).to.equal(
        1
      );
      return undefined;
    });
  });

  it('should move the start operation with given id down', () => {
    // given
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
      expect(config.startOperations.findIndex(x => x.id === op2.id)).to.equal(
        0
      );
      return undefined;
    });
  });

  it('should return the configuration editor', () => {
    // test
    const result = actionEditor.next();

    // expect
    expect(result).to.equal(configurationFactory);
  });

  it('should pass the configuration to the getConfiguration callback', () => {
    // given
    let config = null;

    // test
    actionEditor.getConfiguration(c => (config = c));

    // expect
    expect(config).to.not.be.null;
  });

  it('should substitute the actionConfig with the instance returned from the getConfiguration callback', () => {
    // given
    let config: IActionConfiguration = ({
      id: '888-777-666',
    } as unknown) as IActionConfiguration;

    // test
    actionEditor.getConfiguration(_c => config);

    // expect
    actionEditor.getConfiguration(cf => {
      expect(config).to.eql(cf);
      return undefined;
    });
  });
});
