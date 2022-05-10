import { expect } from 'chai';
import { suite } from 'uvu';
import { setStyle } from '../../../operation/set-style';
import { applyOperation } from '../../../util/apply-operation';

class MockElement {
  cssProps: any;
  css(cssProps: any) {
    this.cssProps = cssProps;
  }
}

const SetStyleSuite = suite('setStyle');

SetStyleSuite('should set the style on the specified element', () => {
  // given
  const mockElement = new MockElement();
  const operationData = {
    display: 'block',
    properties: {
      visible: true,
      display: 'operationdata.display',
    },
    selectedElement: mockElement as any as JQuery,
  };

  // test
  applyOperation(setStyle, operationData);

  // expect
  expect(mockElement.cssProps.visible).to.be.true;
  expect(mockElement.cssProps.display).to.equal('block');
});

SetStyleSuite(
  'should set the style on the specified element with a custom propertyName',
  () => {
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
  }
);

SetStyleSuite.run();
