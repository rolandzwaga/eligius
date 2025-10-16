import {expect} from 'chai';
import {describe, test} from 'vitest';
import {
  type ISetElementContentOperationData,
  setElementContent,
} from '../../../operation/set-element-content.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

class MockElement {
  htmlContent: string = '';
  appendContent: string = '';
  prependContent: string = '';

  html(content: string) {
    this.htmlContent = content;
  }

  append(content: string) {
    this.appendContent = content;
  }

  prepend(content: string) {
    this.prependContent = content;
  }
}

describe('setElementContent', () => {
  test('should set the given element with the specified content', () => {
    // given
    const mockElement = new MockElement();
    const operationData: ISetElementContentOperationData = {
      selectedElement: mockElement as any as JQuery,
      template: '<div/>',
      insertionType: 'overwrite',
    };

    // test
    applyOperation(setElementContent, operationData);

    // expect
    expect(mockElement.htmlContent).to.equal(operationData.template);
  });
  test('should append the given element with the specified content', () => {
    // given
    const mockElement = new MockElement();
    const operationData: ISetElementContentOperationData = {
      insertionType: 'append',
      selectedElement: mockElement as any as JQuery,
      template: '<div/>',
    };

    // test
    applyOperation(setElementContent, operationData);

    // expect
    expect(mockElement.appendContent).to.equal(operationData.template);
  });
  test('should prepend the given element with the specified content', () => {
    // given
    const mockElement = new MockElement();
    const operationData: ISetElementContentOperationData = {
      insertionType: 'prepend',
      selectedElement: mockElement as any as JQuery,
      template: '<div/>',
    };

    // test
    applyOperation(setElementContent, operationData);

    // expect
    expect(mockElement.prependContent).to.equal(operationData.template);
  });
});
