import addClass from '../../operation/addClass';
import { expect } from 'chai';

describe('addClass operation', () => {
  it('should add the specified class to the element', () => {
    // given
    const elementMock = {
      addClass: function (className) {
        this.className = className;
      },
    };

    const operationData = {
      className: 'testClass',
      selectedElement: elementMock,
    };

    // test
    const data = addClass(operationData);

    // expect
    expect(data).to.equal(operationData);
    expect(elementMock.className).to.equal(operationData.className);
  });
});
