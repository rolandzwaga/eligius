import { expect } from 'chai';
import { toggleClass } from '../../../operation/toggle-class';
import { applyOperation } from './apply-operation';

class MockElement {
  className: string = '';
  toggleClass(className: string) {
    this.className = className;
  }
}

describe('toggleClass', () => {
  it('should toggle the specified clas on the given element', () => {
    // given
    const mockElement: JQuery = new MockElement() as any;
    const operationData = {
      selectedElement: mockElement,
      className: 'testClass',
    };

    // test
    const newData = applyOperation(toggleClass, operationData);

    // expect
    expect((mockElement as any).className).to.equal(operationData.className);
    expect(newData).to.equal(operationData);
  });
});
