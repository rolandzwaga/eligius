import { expect } from 'chai';
import { setStyle } from '~/operation/set-style';

class MockElement {
  cssProps: any;
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
        display: 'operationdata.display',
      },
      selectedElement: (mockElement as any) as JQuery,
    };

    // test
    setStyle(operationData, {} as any);

    // expect
    expect(mockElement.cssProps.visible).to.be.true;
    expect(mockElement.cssProps.display).to.equal('block');
  });

  it('should set the syle on the specified element with a custom propertyName', () => {
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
    setStyle(operationData, {} as any);

    // expect
    expect(mockElement.cssProps.visible).to.be.true;
    expect(mockElement.cssProps.display).to.equal('block');
  });
});
