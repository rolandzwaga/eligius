import { expect } from 'chai';
import { toggleElement } from '../../../operation/toggle-element';
import { applyOperation } from './apply-operation';

class MockElement {
  isToggled: boolean = false;
  toggle() {
    this.isToggled = true;
  }
}

describe('toggleElement', () => {
  it('should toggle the given element', () => {
    // given
    const mockElement: JQuery = new MockElement() as any;
    const operationData = {
      selectedElement: mockElement,
    };

    // test
    const newData = applyOperation(toggleElement, operationData);

    // expect
    expect(newData).to.equal(operationData);
    expect((mockElement as any).isToggled).to.be.true;
  });
});
