import { expect } from 'chai';
import { ConfigurationFactory } from '../../../../configuration/api';
import {
  EndableActionEditor,
  OperationEditor,
} from '../../../../configuration/api/action-editor';
import { IEndableActionConfiguration } from '../../../../configuration/types';

describe('EndableActionEditor', () => {
  let endableActionEditor: EndableActionEditor = {} as EndableActionEditor;
  let configurationFactory: ConfigurationFactory = {} as ConfigurationFactory;
  let actionConfig: IEndableActionConfiguration = {} as IEndableActionConfiguration;

  beforeEach(() => {
    configurationFactory = {} as ConfigurationFactory;
    actionConfig = {
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
    endableActionEditor = new EndableActionEditor(
      actionConfig,
      configurationFactory
    );
  });

  it('should return an operation editor', () => {
    // given

    // test
    const editor = endableActionEditor.editEndOperation('test');

    // expect
    expect(editor).to.be.an.instanceOf(OperationEditor);
  });

  it('should throw an operation not found error', () => {
    // given
    let errorMessage = null;
    // test
    try {
      endableActionEditor.editEndOperation('test2');
    } catch (e) {
      errorMessage = e.message;
    }

    // expect
    expect(errorMessage).to.equal('operation not found for id test2');
  });

  it('should remove the operation with the given id', () => {
    // given
    // test
    endableActionEditor.removeEndOperation('test');

    // expect
    endableActionEditor.getConfiguration(config => {
      expect(config.endOperations.length).to.equal(0);
      return undefined;
    });
  });
});
