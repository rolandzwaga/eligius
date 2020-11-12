import { expect } from 'chai';
import { clearElement } from '~/operation/clear-element';

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
    clearElement(operationData as any, {} as any);

    // expect
    expect(operationData.selectedElement.emptied).to.be.true;
  });
});
