import { expect } from 'chai';
import removePropertiesFromOperationData from "../../src/operation/removePropertiesFromOperationData";

describe('removePropertiesFromOperationData', () => {

    it('should remove the specified properties from the given operationData', () => {
        // given
        const operationData = {
            testProp1: 'test1',
            testProp2: 'test2',
            testProp3: 'test3',
            propertyNames: ['testProp1', 'testProp2']
        };

        // test
        const newData = removePropertiesFromOperationData(operationData);

        // expect
        expect(newData).to.equal(operationData);
        expect(newData.hasOwnProperty('testProp1')).to.be.false;
        expect(newData.hasOwnProperty('testProp2')).to.be.false;
        expect(newData.hasOwnProperty('propertyNames')).to.be.false;
        expect(newData.testProp3).to.equal('test3');
    });
});