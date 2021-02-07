import { expect } from 'chai';
import { ISetElementContentOperationData, setElementContent } from '../operation/set-element-content';

class MockElement {
  htmlContent: string;
  appendContent: string;
  prependContent: string;

  html(content) {
    this.htmlContent = content;
  }

  append(content) {
    this.appendContent = content;
  }

  prepend(content) {
    this.prependContent = content;
  }
}

describe('setElementContent', () => {
  it('should set the given element with the specified content', () => {
    // given
    const mockElement = new MockElement();
    const operationData: ISetElementContentOperationData = {
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
    const operationData: ISetElementContentOperationData = {
      insertionType: 'append',
      selectedElement: (mockElement as any) as JQuery,
      template: '<div/>',
    };

    // test
    setElementContent(operationData, {} as any);

    // expect
    expect(mockElement.appendContent).to.equal(operationData.template);
  });

  it('should prepend the given element with the specified content', () => {
    // given
    const mockElement = new MockElement();
    const operationData: ISetElementContentOperationData = {
      insertionType: 'prepend',
      selectedElement: (mockElement as any) as JQuery,
      template: '<div/>',
    };

    // test
    setElementContent(operationData, {} as any);

    // expect
    expect(mockElement.prependContent).to.equal(operationData.template);
  });
});
