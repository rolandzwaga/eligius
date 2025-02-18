import { expect } from 'chai';
import { describe, test } from 'vitest';
import {
  type IReparentElementOperationData,
  reparentElement,
} from '../../../operation/reparent-element.ts';
import { applyOperation } from '../../../util/apply-operation.ts';

class MockElement {
  selector: string = '';
  calledRemove: boolean = false;

  appendTo(selector: string) {
    this.selector = selector;
  }

  remove() {
    this.calledRemove = true;
    return this;
  }
}

describe('reparentElement', () => {
  test('should set the parent of the given element to the new given parent', () => {
    // given
    const mockElement = new MockElement();
    const operationData = {
      selectedElement: mockElement,
      newParentSelector: '.parent-class',
    } as any as IReparentElementOperationData;

    // test
    applyOperation(reparentElement, operationData);

    // expect
    expect(mockElement.calledRemove).to.be.true;
    expect(mockElement.selector).to.equal(operationData.newParentSelector);
  });
});
