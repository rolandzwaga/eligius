import { expect } from 'chai';
import { suite } from 'uvu';
import { setElementAttributes } from '../../../operation/set-element-attributes';
import { applyOperation } from '../../../util/apply-operation';

class MockElement {
  names: string[] = [];
  values: any[] = [];

  attr(attrName: string, attrValue: any) {
    this.names.push(attrName);
    this.values.push(attrValue);
  }
}

const SetElementAttributesSuite = suite('setElementAttributes');

SetElementAttributesSuite(
  'should set the given attributes on the specified element',
  () => {
    // given
    const mockElement = new MockElement();
    const operationData = {
      attributes: {
        testProp1: 'test1',
        testProp2: 'test2',
      },
      selectedElement: mockElement as any as JQuery,
    };

    // test
    applyOperation(setElementAttributes, operationData);

    // expect
    expect(mockElement.names).to.contain('testProp1');
    expect(mockElement.names).to.contain('testProp2');
    expect(mockElement.values).to.contain('test1');
    expect(mockElement.values).to.contain('test2');
  }
);

SetElementAttributesSuite.run();
