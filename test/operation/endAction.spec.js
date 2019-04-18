import {
    expect
} from 'chai';
import endAction from "../../src/operation/endAction";

class MockAction {
    end(operationData) {
        return new Promise(resolve => {
            resolve(operationData);
        });
    }
}

describe('endAction', () => {

    it('should call the end() method on the given action with the given operationdata', () => {
        // given
        const mockAction = new MockAction();

        const operationData = {
            actionInstance: mockAction,
            actionOperationData: {
                test: true
            }
        };

        // test
        return endAction(operationData).then((result) => {
            expect(result).to.equal(operationData);
        });
    });
});