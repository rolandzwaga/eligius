import { expect } from 'chai';
import { suite } from 'uvu';
import { toggleClass } from '../../../operation/toggle-class';
import { applyOperation } from '../../../util/apply-operation';

class MockElement {
  className: string = '';
  toggleClass(className: string) {
    this.className = className;
  }
}

const ToggleClassSuite = suite('toggleClass');

ToggleClassSuite(
  'should toggle the specified clas on the given element',
  () => {
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
  }
);

ToggleClassSuite.run();
