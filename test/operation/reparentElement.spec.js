import { expect } from 'chai';
import reparentElement from "../../src/operation/reparentElement";

class MockElement {
    appendTo(selector) {
        this.selector = selector;
    }

    remove() {
        this.calledRemove = true;
        return this;
    }
}

describe('reparentElement', () => {

    it('should set the parent of the given element to the new given parent', () => {
        // given
        const mockElement = new MockElement();
        const operationData = {
            selectedElement: mockElement,
            newParentSelector: '.parent-class'
        };

        // test
        reparentElement(operationData);

        // expect
        expect(mockElement.calledRemove).to.be.true;
        expect(mockElement.selector).to.equal(operationData.newParentSelector);
    });

});