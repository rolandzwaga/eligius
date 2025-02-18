import { expect } from 'chai';
import { describe, test } from 'vitest';
import { setOperationData } from '../../../operation/set-operation-data.ts';
import { applyOperation } from '../../../util/apply-operation.ts';
describe('setOperationData', () => {
  test('should set the specified operation data', () => {
    // given
    const operationData = {
      unusedProperty: 'test',
      testProperty: 'testProperty1',
      prop5: false,
      prop6: 'foo',
      prop7: 'bar',
      properties: {
        prop1: 'prop1',
        prop2: 'prop2',
        prop3: 'operationdata.testProperty',
        prop4: 100,
        prop5: true,
        prop6: null,
        prop7: undefined,
      },
    };

    // test
    const newData = applyOperation<
      typeof operationData.properties & { unusedProperty: string }
    >(setOperationData, operationData);

    // expect
    expect(newData.unusedProperty).to.equal('test');
    expect(newData.prop1).to.equal('prop1');
    expect(newData.prop2).to.equal('prop2');
    expect(newData.prop3).to.equal('testProperty1');
    expect(newData.prop4).to.equal(100);
    expect(newData.prop5).to.equal(true);
    expect(newData.prop6).to.equal(null);
    expect(newData.prop7).to.equal(undefined);
    expect('properties' in newData).to.be.false;
  });
  test('should override all the existing operationdata with the specified data', () => {
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
    const newData = applyOperation<
      typeof operationData.properties & {
        unusedProperty: string;
        testProperty: string;
        override: boolean;
      }
    >(setOperationData, operationData);

    // expect
    expect(newData.unusedProperty).to.be.undefined;
    expect(newData.testProperty).to.be.undefined;
    expect(newData.override).to.be.undefined;
    expect(newData.prop1).to.equal('prop1');
    expect(newData.prop2).to.equal('prop2');
    expect(newData.prop3).to.equal('testProperty1');
  });
});
