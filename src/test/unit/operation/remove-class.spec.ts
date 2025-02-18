import { expect } from 'chai';
import { suite } from 'uvu';
import { removeClass } from '../../../operation/remove-class.ts';
import { applyOperation } from '../../../util/apply-operation.ts';

class MockElement {
  removedClassName: string = '';

  removeClass(className: string) {
    this.removedClassName = className;
  }
}

const RemoveClassSuite = suite('removeClass');

RemoveClassSuite('should remove the class from the given element', () => {
  // given
  const mockElement = new MockElement();
  const operationData = {
    selectedElement: mockElement as any as JQuery,
    className: 'testClass',
  };

  // test
  applyOperation(removeClass, operationData);

  // expect
  expect(mockElement.removedClassName).to.equal(operationData.className);
});

RemoveClassSuite.run();
