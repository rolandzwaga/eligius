import { expect } from 'chai';
import { setOperationData } from '../operation/set-operation-data';

describe('setOperationData', () => {
  it('should set the specified operation data', () => {
    // given
    const operationData = {
      unusedProperty: 'test',
      testProperty: 'testProperty1',
      properties: {
        prop1: 'prop1',
        prop2: 'prop2',
        prop3: 'operationdata.testProperty',
      },
    };

    // test
    const newData: any = setOperationData(operationData, {} as any);

    // expect
    expect(newData.unusedProperty).to.equal('test');
    expect(newData.prop1).to.equal('prop1');
    expect(newData.prop2).to.equal('prop2');
    expect(newData.prop3).to.equal('testProperty1');
  });

  it('should override all the existing operationdata with the specified data', () => {
    // given
    const operationData = {
      unusedProperty: 'test',
      testProperty: 'testProperty1',
      override: true,
      properties: {
        prop1: 'prop1',
        prop2: 'prop2',
        prop3: 'operationdata.testProperty',
      },
    };

    // test
    const newData: any = setOperationData(operationData, {} as any);

    // expect
    expect(newData.unusedProperty).to.be.undefined;
    expect(newData.testProperty).to.be.undefined;
    expect(newData.override).to.be.undefined;
    expect(newData.prop1).to.equal('prop1');
    expect(newData.prop2).to.equal('prop2');
    expect(newData.prop3).to.equal('testProperty1');
  });
});
