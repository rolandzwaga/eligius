import { expect } from 'chai';
import { toggleClass } from '../../../operation/toggle-class';

class MockElement {
  className: string;
  toggleClass(className) {
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
    const newData = toggleClass(operationData, {} as any);

    // expect
    expect((mockElement as any).className).to.equal(operationData.className);
    expect(newData).to.equal(operationData);
  });
});
