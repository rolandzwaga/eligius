import { expect } from 'chai';
import { addClass } from '~/operation/add-class';

describe('addClass operation', () => {
  it('should add the specified class to the element', () => {
    // given
    const elementMock = {
      className: '',
      addClass: function (className) {
        this.className = className;
      },
    };

    const operationData = {
      className: 'testClass',
      selectedElement: (elementMock as any) as JQuery,
    };

    // test
    const data = addClass(operationData, {} as any);

    // expect
    expect(data).to.equal(operationData);
    expect(elementMock.className).to.equal(operationData.className);
  });
});
