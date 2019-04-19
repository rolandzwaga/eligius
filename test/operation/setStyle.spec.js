import { expect } from 'chai';
import setStyle from "../../src/operation/setStyle";

class MockElement {
    css(cssProps) {
        this.cssProps = cssProps;
    }
}

describe('setStyle', () => {

    it('should set the syle on the specified element', () => {
        // given
        const mockElement = new MockElement();
        const operationData = {
            display: 'block',
            properties: {
                visible: true,
                display: 'operationdata.display'
            },
            selectedElement: mockElement
        };

        // test
        setStyle(operationData);

        // expect
        expect(mockElement.cssProps.visible).to.be.true;
        expect(mockElement.cssProps.display).to.equal('block');
 
    });

});