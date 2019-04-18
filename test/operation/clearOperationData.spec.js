import {
    expect
} from 'chai';
import clearOperationData from "../../src/operation/clearOperationData";

describe('clearOperationData', () => {
    it('should clear the given operation data', () => {
        // given
        const operationData = {
            bla: 1,
            bla2: true,
            bla3: 'hello'
        }

        // test
        const newOperationData = clearOperationData(operationData);

        // expect
        expect(newOperationData).to.not.equal(operationData);
    });
});