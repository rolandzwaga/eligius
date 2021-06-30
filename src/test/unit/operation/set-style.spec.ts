import { expect } from 'chai';
import { setStyle } from '../../../operation/set-style';
import { applyOperation } from './apply-operation';

class MockElement {
  cssProps: any;
  css(cssProps: any) {
    this.cssProps = cssProps;
  }
}

describe('setStyle', () => {
  it('should set the style on the specified element', () => {
    // given
    const mockElement = new MockElement();
    const operationData = {
      display: 'block',
      properties: {
        visible: true,
        display: 'operationdata.display',
      },
      selectedElement: (mockElement as any) as JQuery,
    };

    // test
    applyOperation(setStyle, operationData);

    // expect
    expect(mockElement.cssProps.visible).to.be.true;
    expect(mockElement.cssProps.display).to.equal('block');
  });

  it('should set the style on the specified element with a custom propertyName', () => {
    // given
    const mockElement = new MockElement();
    const operationData = {
      display: 'block',
      properties: {
        visible: true,
        display: 'operationdata.display',
      },
      template: mockElement,
      propertyName: 'template',
    };

    // test
    applyOperation(setStyle, operationData);

    // expect
    expect(mockElement.cssProps.visible).to.be.true;
    expect(mockElement.cssProps.display).to.equal('block');
  });
});
