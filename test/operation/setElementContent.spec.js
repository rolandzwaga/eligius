import { expect } from 'chai';
import setElementContent from "../../src/operation/setElementContent";

class MockElement {

    html(content) {
        this.htmlContent = content;
    }

    append(content) {
        this.appendContent = content;
    }

}

describe('setElementContent', () => {

    it('should set the given element with the specified content', () => {
        // given
        const mockElement = new MockElement();
        const operationData = {
            append: false,
            selectedElement: mockElement,
            template: '<div/>'
        };

        // test
        setElementContent(operationData);

        // expect
        expect(mockElement.htmlContent).to.equal(operationData.template);
    });

    it('should append the given element with the specified content', () => {
        // given
        const mockElement = new MockElement();
        const operationData = {
            append: true,
            selectedElement: mockElement,
            template: '<div/>'
        };

        // test
        setElementContent(operationData);

        // expect
        expect(mockElement.appendContent).to.equal(operationData.template);
    });

});