import { expect } from 'chai';
import attachControllerToElement from "../../../src/operation/helper/attachControllerToElement";

class MockElement {
    data(name, list) {
        this.name = name;
        if (list) {
            this.list = list;
        }
        return this.list;
    }
}

describe('attachControllerToElement', () => {
    
    it('should attach the given controller to the given element', () => {
        // given
        const element = new MockElement();
        const controller = {};
        
        // test
        attachControllerToElement(element, controller);

        // expect
        expect(MockElement.list).to.contain(controller);
    })

});