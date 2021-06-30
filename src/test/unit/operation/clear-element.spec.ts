import { expect } from 'chai';
import { clearElement } from '../../../operation/clear-element';
import { applyOperation } from './apply-operation';

class MockElement {
  emptied = false;

  empty() {
    this.emptied = true;
  }
}

describe('clearElement', () => {
  it('should clear the given element', () => {
    // given
    const operationData = {
      selectedElement: new MockElement(),
    };

    // test
    const result = applyOperation<typeof operationData>(
      clearElement,
      operationData
    );

    // expect
    expect(result.selectedElement.emptied).to.be.true;
  });
});
