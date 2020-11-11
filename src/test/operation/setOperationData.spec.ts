import { expect } from 'chai';
import setOperationData from '../../operation/setOperationData';

describe('setOperationData', () => {
  it('should set the specified operation data', () => {
    // given
    const operationData = {
      testProperty: 'testProperty1',
      properties: {
        prop1: 'prop1',
        prop2: 'prop2',
        prop3: 'operationdata.testProperty',
      },
    };

    // test
    const newData = setOperationData(operationData);

    // expect
    expect(newData.prop1).to.equal('prop1');
    expect(newData.prop2).to.equal('prop2');
    expect(newData.prop3).to.equal('testProperty1');
  });
});
