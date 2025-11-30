import {
  type IReparentElementOperationData,
  reparentElement,
} from '@operation/reparent-element.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test} from 'vitest';

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
    expect(mockElement.calledRemove).toBe(true);
    expect(mockElement.selector).toBe('.parent-class');
  });

  test('should remove the newParentSelector property from the operation data', () => {
    // given
    const mockElement = new MockElement();
    const operationData = {
      selectedElement: mockElement,
      newParentSelector: '.parent-class',
    } as any as IReparentElementOperationData;

    // test
    const newData = applyOperation(reparentElement, operationData);

    // expect
    expect('newParentSelector' in newData).toBe(false);
  });
});
