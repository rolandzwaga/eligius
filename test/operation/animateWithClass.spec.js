import {
    expect
} from 'chai';
import animateWithClass from "../../src/operation/animateWithClass";

class MockElement {

    removedCalled = false;

    constructor(expectedClass) {
        this.expectedClass = expectedClass;
    }

    one(eventNames, handler) {
        this.handler = handler;
    }

    addClass(className) {
        expect(className).to.equal(this.expectedClass);
    }

    removeClass(className) {
        this.removedCalled = true;
        expect(className).to.equal(this.expectedClass);
    }

}

describe('animateWithClass', () => {

    it('should animate by adding the specified class, and remove the class afterwards', () => {
        // given
        const mockElement = new MockElement('testClass');

        const operationData = {
            selectedElement: mockElement,
            className: 'testClass'
        }

        // test
        const promise = animateWithClass(operationData);
        mockElement.handler();
        expect(mockElement.removedCalled).to.be.true;
        return promise;
    });

    it('should animate by adding the specified class, and keep the class afterwards', () => {
        // given
        const mockElement = new MockElement('testClass');

        const operationData = {
            selectedElement: mockElement,
            className: 'testClass',
            removeClass: false
        }

        // test
        const promise = animateWithClass(operationData);
        mockElement.handler();
        expect(mockElement.removedCalled).to.be.false;
        return promise;
    });

});