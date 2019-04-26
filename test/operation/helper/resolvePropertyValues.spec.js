import { expect } from 'chai';
import resolvePropertyValues from "../../../src/operation/helper/resolvePropertyValues";

describe('resolvePropertyValues', () => {

    it('should resolve the given property values', () => {
        // given
        const operationData = {
            test1: 'test1',
            test2: 100,
            test3: true
        };
        const properties = {
            testValue1: 'operationdata.test1',
            testValue2: 'operationdata.test2',
            testValue3: 'operationdata.test3'
        };

        // test
        const resolved = resolvePropertyValues(operationData, properties);

        // expect
        expect(resolved.testValue1).to.equal('test1');
        expect(resolved.testValue2).to.equal(100);
        expect(resolved.testValue3).to.be.true;
    })

});