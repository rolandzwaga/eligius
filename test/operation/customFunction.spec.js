import {
    expect
} from 'chai';
import customFunction from "../../src/operation/customFunction";

class MockEventbus {

    constructor(testFunction) {
        this.testFunction = testFunction;
    }

    broadcast(eventName, args) {
        args[1](this.testFunction);
    }
}

describe('customFunction', () => {
    
    it('should resolve and execute the specified function', () => {
        // given
        const operationData = {
            systemName: 'testName'
        }
        let called = false;
        const func = (opData, eventbus) => {
            called = true;
            expect(opData).to.equal(operationData);
            expect(eventbus).to.equal(mockEventbus);
        };
        const mockEventbus = new MockEventbus(func);

        // test
        return customFunction(operationData, mockEventbus).then(() => {
            expect(called).to.be.true;
        });
    });

    it('should resolve and execute the specified function that itself returns a promise', () => {
        // given
        const operationData = {
            systemName: 'testName'
        }
        let called = false;
        const func = (opData, eventbus) => {
            return new Promise(resolve => {
                called = true;
                expect(opData).to.equal(operationData);
                expect(eventbus).to.equal(mockEventbus);
                resolve();
            });
        };
        const mockEventbus = new MockEventbus(func);

        // test
        return customFunction(operationData, mockEventbus).then(() => {
            expect(called).to.be.true;
        });
    });

});