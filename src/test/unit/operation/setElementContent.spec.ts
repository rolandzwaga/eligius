import { expect } from 'chai';
import { setElementContent } from '~/operation/set-element-content';

class MockElement {
  htmlContent: string;
  appendContent: string;
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
      selectedElement: (mockElement as any) as JQuery,
      template: '<div/>',
    };

    // test
    setElementContent(operationData, {} as any);

    // expect
    expect(mockElement.htmlContent).to.equal(operationData.template);
  });

  it('should append the given element with the specified content', () => {
    // given
    const mockElement = new MockElement();
    const operationData = {
      append: true,
      selectedElement: (mockElement as any) as JQuery,
      template: '<div/>',
    };

    // test
    setElementContent(operationData, {} as any);

    // expect
    expect(mockElement.appendContent).to.equal(operationData.template);
  });
});
