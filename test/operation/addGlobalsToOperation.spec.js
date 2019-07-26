import { expect } from 'chai';
import addGlobalsToOperation from '../../src/operation/addGlobalsToOperation';
import setGlobal from '../../src/operation/helper/setGlobal';

describe('addGlobalsToOperation', () => {

    it('should add the given gloabl properties to the given operation data', () => {
        setGlobal('test', 'testing');
        let operationData = {
            globalProperties: ['test']
        };
        operationData = addGlobalsToOperation(operationData);
        expect(operationData.test).to.equal('testing');
    });

});
