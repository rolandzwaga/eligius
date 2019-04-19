import { expect } from 'chai';
import selectElement from "../../src/operation/selectElement";

class MockEventbus {

    constructor(rootElement) {
        this.rootElement = rootElement;
    }
    
    broadcast(eventName, args) {
        args[0](this.rootElement);
    }
}

class MockElement {

    constructor(selectedElement) {
        this.selectedElement = selectedElement;
    }

    find(selector) {
        this.selector = selector;
        return this.selectedElement;
    }

}

describe('selectElement', () => {
    
    it('should select the element based on the specified selector', () => {
        // given
        const selectedElement = {
            length: 1
        };
        const mockElement = new MockElement(selectedElement);
        const eventbus = new MockEventbus(mockElement);
        const operationData = {
            selector: '.testClass'
        };

        // test
        const newData = selectElement(operationData, eventbus);

        // expect
        expect(newData.selectedElement).to.equal(selectedElement);
    });

    it('should select the element based on the specified selector from the existing root', () => {
        // given
        const selectedElement = {
            length: 1
        };
        const mockElement = new MockElement(selectedElement);
        const operationData = {
            selector: '.testClass',
            useExistingAsRoot: true,
            selectedElement: mockElement
        };

        // test
        const newData = selectElement(operationData);

        // expect
        expect(newData.selectedElement).to.equal(selectedElement);
    });

    it('should select the element based on the specified selector from the existing root that is assigned to a specified property on the operationdata', () => {
        // given
        const selectedElement = {
            length: 1
        };
        const mockElement = new MockElement(selectedElement);
        const operationData = {
            selector: '.testClass',
            useExistingAsRoot: true,
            otherProperty: mockElement,
            propertyName: 'otherProperty'
        };

        // test
        const newData = selectElement(operationData);

        // expect
        expect(newData.otherProperty).to.equal(selectedElement);
    });

});