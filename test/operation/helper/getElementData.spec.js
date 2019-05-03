import { expect } from 'chai';
import { getElementData, getElementControllers } from "../../../src/operation/helper/getElementData";

class MockElement {
    data(name) {
        this.name = name;
    }
}

describe('getElementData', () => {
    it('should get the element data', () => {
        // given
        const mockElement = new MockElement();
        const name = 'test';

        // test
        getElementData(name, mockElement);

        // expect
        expect(mockElement.name).to.equal(name);
    });

    it('should retrieve the chronoEngineControllers data', () => {
        // given
        const mockElement = new MockElement();

        // test
        getElementControllers(mockElement);

        // expect
        expect(mockElement.name).to.equal('chronoEngineControllers');
    })
});