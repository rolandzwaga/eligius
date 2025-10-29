import {expect} from 'chai';
import {describe, test} from 'vitest';
import {addClass} from '../../../operation/add-class.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('addClass', () => {
  test('should add the specified class to the element', () => {
    // given
    const elementMock = {
      className: '',
      addClass: function (className: string) {
        this.className = className;
      },
    };

    const operationData = {
      className: 'testClass',
      selectedElement: elementMock as any as JQuery,
    };

    // test
    const data = applyOperation(addClass, operationData);

    // expect
    expect(data).to.equal(operationData);
    expect(elementMock.className).to.equal('testClass');
  });

  test('should remove the className property from the operation data', () => {
    // given
    const elementMock = {
      className: '',
      addClass: function (className: string) {
        this.className = className;
      },
    };

    const operationData = {
      className: 'testClass',
      selectedElement: elementMock as any as JQuery,
    };

    // test
    const newData = applyOperation(addClass, operationData);

    // expect
    expect('className' in newData).to.be.false;
  });
});
