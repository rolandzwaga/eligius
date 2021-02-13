import { expect } from 'chai';
import { setElementAttributes } from '../../../operation/set-element-attributes';

class MockElement {
  names = [];
  values = [];

  attr(attrName, attrValue) {
    this.names.push(attrName);
    this.values.push(attrValue);
  }
}

describe('setElementAttributes', () => {
  it('should set the given attributes on the specified element', () => {
    // given
    const mockElement = new MockElement();
    const operationData = {
      attributes: {
        testProp1: 'test1',
        testProp2: 'test2',
      },
      selectedElement: (mockElement as any) as JQuery,
    };

    // test
    setElementAttributes(operationData, {} as any);

    // expect
    expect(mockElement.names).to.contain('testProp1');
    expect(mockElement.names).to.contain('testProp2');
    expect(mockElement.values).to.contain('test1');
    expect(mockElement.values).to.contain('test2');
  });
});
