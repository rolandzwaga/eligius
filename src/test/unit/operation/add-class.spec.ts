import { expect } from 'chai';
import { suite } from 'uvu';
import { addClass } from '../../../operation/add-class';
import { applyOperation } from '../../../util/apply-operation';

const AddClassSuite = suite('addClass');

AddClassSuite('should add the specified class to the element', () => {
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
  expect(elementMock.className).to.equal(operationData.className);
});

AddClassSuite.run();
