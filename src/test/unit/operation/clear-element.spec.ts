import {clearElement} from '@operation/clear-element.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test} from 'vitest';

class MockElement {
  emptied = false;

  empty() {
    this.emptied = true;
  }
}

describe('clearElement', () => {
  test('should clear the given element', () => {
    // given
    const operationData = {
      selectedElement: new MockElement(),
    };

    // test
    const result = applyOperation(clearElement, operationData);

    // expect
    expect((result.selectedElement as unknown as MockElement).emptied).to.be
      .true;
  });
});
