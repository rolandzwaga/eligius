import { expect } from 'chai';
import {
  IReparentElementOperationData,
  reparentElement,
} from '../../../operation/reparent-element';

class MockElement {
  selector: string;
  calledRemove: boolean;

  appendTo(selector) {
    this.selector = selector;
  }

  remove() {
    this.calledRemove = true;
    return this;
  }
}

describe('reparentElement', () => {
  it('should set the parent of the given element to the new given parent', () => {
    // given
    const mockElement = new MockElement();
    const operationData = ({
      selectedElement: mockElement,
      newParentSelector: '.parent-class',
    } as any) as IReparentElementOperationData;

    // test
    reparentElement(operationData, {} as any);

    // expect
    expect(mockElement.calledRemove).to.be.true;
    expect(mockElement.selector).to.equal(operationData.newParentSelector);
  });
});
