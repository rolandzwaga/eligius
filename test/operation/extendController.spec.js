import {
    expect
} from 'chai';
import extendController from "../../src/operation/extendController";

describe('extendController', () => {

    it('should extend the given controller', () => {
        // given
        const operationData = {
            controllerInstance: {
                prop1: 'prop1'
            },
            controllerExtension: {
                prop2: 'prop2'
            }
        };

        // test
        const newData = extendController(operationData);

        // expect
        expect(newData.controllerInstance.prop1).to.equal('prop1');
        expect(newData.controllerInstance.prop2).to.equal('prop2');
    });
});