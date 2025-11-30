import {toggleElement} from '@operation/toggle-element.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test} from 'vitest';

class MockElement {
  isToggled: boolean = false;
  toggle() {
    this.isToggled = true;
  }
}

describe('toggleElement', () => {
  test('should toggle the given element', () => {
    // given
    const mockElement: JQuery = new MockElement() as unknown as JQuery;
    const operationData = {
      selectedElement: mockElement,
    };

    // test
    const newData = applyOperation(toggleElement, operationData);

    // expect
    expect(newData).toBe(operationData);
    expect((mockElement as unknown as MockElement).isToggled).toBe(true);
  });
});
