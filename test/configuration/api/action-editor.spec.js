import { expect } from 'chai';
import { ActionEditor, OperationEditor } from "../../../src/configuration/api/action-editor";

describe('ActionEditor', () => {

    let actionEditor = null;
    let configurationFactory = null;
    let actionConfig = null;

    beforeEach(() => {
        configurationFactory = {};
        actionConfig = {
            id: '111-222-333',
            name: 'name',
            startOperations: []
        };
        actionEditor = new ActionEditor(actionConfig, configurationFactory);
    });

    it('should initialize properly', () => {
        // expect
        expect(actionEditor.configurationFactory).is.equal(configurationFactory);
        expect(actionEditor.actionConfig).is.equal(actionConfig);
    });

    it('should set the name', () => {
        // given
        

        // test
        actionEditor.setName('TestName');

        // expect
        const { actionConfig } =  actionEditor;
        expect(actionConfig.name).to.equal('TestName');
    });

    it('should return an operation editor', () => {
        // given
        const { actionConfig } =  actionEditor;
        actionConfig.startOperations.push({
            id: 'test',
            operationData: {}
        });

        // test
        const editor = actionEditor.editStartOperation('test')

        // expect
        expect(editor).to.be.an.instanceOf(OperationEditor);
    });

    it('should throw an operation not found error', () => {
        // given
        let errorMessage = null;
        // test
        try{
            actionEditor.editStartOperation('test')
        } catch(e) {
            errorMessage = e.message;
        }

        // expect
        expect(errorMessage).to.equal('operation not found for id test');
    });

    it('should remove the operation with the given id', () => {
        // given
        const { actionConfig } =  actionEditor;
        actionConfig.startOperations.push({
            id: 'test',
            operationData: {}
        });

        // test
        actionEditor.removeStartOperation('test')

        // expect
        expect(actionConfig.startOperations.length).to.equal(0);
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
        actionEditor.getConfiguration(c => config = c);

        // expect
        expect(config).to.equal(actionEditor.actionConfig);
    });

    it('should substitute the actionConfig with the instance returned from the getConfiguration callback', () => {
        // given
        let config = {
            'id': '888-777-666'
        };

        // test
        actionEditor.getConfiguration(c => config);

        // expect
        expect(config).to.equal(actionEditor.actionConfig);

    });

});
