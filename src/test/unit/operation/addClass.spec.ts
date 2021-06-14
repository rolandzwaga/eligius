import { expect } from 'chai';
import { addClass } from '../../../operation/add-class';
import { applyOperation } from './apply-operation';

describe('addClass operation', () => {
  it('should add the specified class to the element', () => {
    // given
    const elementMock = {
      className: '',
      addClass: function(className: string) {
        this.className = className;
      },
    };

    const operationData = {
      className: 'testClass',
      selectedElement: (elementMock as any) as JQuery,
    };

    // test
    const data = applyOperation(addClass, operationData);

    // expect
    expect(data).to.equal(operationData);
    expect(elementMock.className).to.equal(operationData.className);
  });
});
