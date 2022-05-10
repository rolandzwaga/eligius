import { expect } from 'chai';
import { suite } from 'uvu';
import { clearElement } from '../../../operation/clear-element';
import { applyOperation } from '../../../util/apply-operation';

class MockElement {
  emptied = false;

  empty() {
    this.emptied = true;
  }
}

const ClearElementSuite = suite('clearElement');

ClearElementSuite('should clear the given element', () => {
  // given
  const operationData = {
    selectedElement: new MockElement(),
  };

  // test
  const result = applyOperation<typeof operationData>(
    clearElement,
    operationData
  );

  // expect
  expect(result.selectedElement.emptied).to.be.true;
});

ClearElementSuite.run();
