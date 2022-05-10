import { expect } from 'chai';
import { suite } from 'uvu';
import { toggleElement } from '../../../operation/toggle-element';
import { applyOperation } from '../../../util/apply-operation';

class MockElement {
  isToggled: boolean = false;
  toggle() {
    this.isToggled = true;
  }
}

const ToggleElementSuite = suite('toggleElement');

ToggleElementSuite('should toggle the given element', () => {
  // given
  const mockElement: JQuery = new MockElement() as unknown as JQuery;
  const operationData = {
    selectedElement: mockElement,
  };

  // test
  const newData = applyOperation(toggleElement, operationData);

  // expect
  expect(newData).to.equal(operationData);
  expect((mockElement as unknown as MockElement).isToggled).to.be.true;
});

ToggleElementSuite.run();
